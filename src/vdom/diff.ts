import options from "../options";
// import { ATTR_KEY } from "../constants";
import { isSameNodeType, isNamedNode } from "./index";
import { VNode } from "../vnode";
import { Component } from "../component";
import { IKeyValue, childType, IBaseVNode, IReactContext, IReactProvider } from "../types";
import { IVDom, buildVDom, setRef } from "./index";
import {
    buildComponentFromVNode,
    unmountComponent,
} from "./component";
import {
    setAccessor,
    createNode,
    removeNode,
    getPreviousSibling,
    getLastChild,
    isTextNode,
} from "../dom/index";
import { findVDom, setVDom, findVoidNode, setVoidNode } from "../find";
import { innerHTML , isArray, REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from "../util";
// import { buildConsumer, buildProvider } from "./context";

export const mounts: any[] = [];

export let diffLevel = 0;

const VOID_NODE: IVDom = {
    base: null,
};

let isSvgMode = false;

let hydrating = false;

/**
 * 对挂载队列触发挂载完成钩子
 */
export function flushMounts() {
    let c;
    while (c = mounts.pop()) {
        const afterMount = options.afterMount;
        if (afterMount) {
            afterMount(c);
        }
        if (c.componentDidMount) {
            c.componentDidMount();
        }
    }
}

/**
 * 比较dom差异
 * @param vdom 原vdom
 * @param vnode jsx
 * @param context 通过render来的是一个空对象。
 * @param mountAll 是否已全部挂载
 * @param parent 挂载元素
 * @param componentRoot 是否为componentRoot
 */
export function diff(
    vdom: IVDom | undefined,
    vnode: childType,
    context: IKeyValue,
    mountAll: boolean,
    parent: any,
    componentRoot: boolean,
): IVDom {
    // if (child.base && dom !== child.base) {
    //     // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
    //     removeDomChild(child);
    // }
    if (!diffLevel++) {
        // 在diff调用递归层数为0时设置isSvgMode，hydrating
        // 判断是否为svg
        isSvgMode = parent != null && parent.ownerSVGDocument !== undefined;
        // 判断是否在上次渲染过了
        hydrating = vdom != null && vdom.props == null;
    }
    // 调用idiff生成dom
    const ret = idiff(
        vdom,
        vnode,
        context,
        mountAll,
        componentRoot,
    );
    // 如果有父dom直接appendChild
    if (parent && ret.base && ret.base.parentNode !== parent) {
        parent.appendChild(ret.base);
    }
    if (parent && !ret.base && ret.component) {
        setVoidNode(parent, {0: ret});
    }
    if (!--diffLevel) {
        // diff调用递归层为0,说明已经全部diff完毕
        hydrating = false;
        if (!componentRoot) {
            // 非renderComponent执行的diff如render，触发挂载完成生命周期
            // 通过renderComponent执行的是更新状态，无需重新触发挂载生命周期
            flushMounts();
        }
    }
    return ret;
}

/**
 * 比较dom和vnode，进行新建dom，复用dom，或者新建组件，复用组件
 * @param vdom 原dom
 * @param vnode 用于创建dom的虚拟对象
 * @param context 组件上下文用于组件创建时使用
 * @param mountAll 是否需要挂载
 * @param componentRoot 是否来自renderComponent
 */
function idiff(
    vdom: IVDom | undefined | null,
    vnode: childType,
    context: IKeyValue,
    mountAll: boolean,
    componentRoot?: boolean,
): IVDom {
    const prevSvgMode = isSvgMode;
    let out = vdom && vdom.base;

    if (vnode == null || typeof vnode === "boolean") {
        // 去除空，布尔值转为空字符串
        return VOID_NODE;
    } else if (typeof vnode === "string" || typeof vnode === "number") {
        // 文本节点处理
        if (
            vdom
            && vdom.base
            && isTextNode(vdom.base)
            && vdom.base.parentNode
            && (!vdom.component || componentRoot)
        ) {
            // 原dom就是文本节点，更新文本内容
            if (vdom.base.nodeValue !== vnode) {
                vdom.base.nodeValue = String(vnode);
            }
        } else {
            // 新建一个文本dom
            const dom = document.createTextNode(String(vnode));
            const newVDom: IVDom = {
                base: dom,
            };
            try {
                setVDom(dom, newVDom);
            } catch (e) {
            }
            if (vdom) {
                // 如果有旧dom，就替换并卸载旧的。
                if (vdom.base && vdom.base.parentNode) {
                    vdom.base.parentNode.replaceChild(dom, vdom.base);
                }
                recollectNodeTree(vdom, true);
            }
            vdom = newVDom;
        }
        // 文本节点的props直接设置为true
        vdom.props = true;
        return vdom;
    }
    let vnodeName = (vnode as VNode).nodeName;
    if (typeof vnodeName === "function") {
        // 是一个组件,创建或复用组件实例，返回dom
        return buildComponentFromVNode(vdom, (vnode as VNode), context, mountAll); // , (vnode as VNode).component);
    }
    // 重新判断一下是否要创建svg
    isSvgMode = vnodeName === "svg"
        ? true : vnodeName === "foreignObject" ? false : isSvgMode;
    // 一般通过babel的jsx无法发生非字符串的vnodeName
    vnodeName = String(vnodeName);
    if (!vdom || !isNamedNode(vdom, vnodeName) || (!componentRoot && vdom.component)) {
        // 没有原dom或者原dom与vnode里的不同，新建一个
        out = createNode(vnodeName, isSvgMode);
        const newVDom: IVDom = {
            base: out,
        };
        setVDom(out, newVDom);
        if (vdom) {
            // 旧dom存在时的一些处理
            // 把旧dom的子元素全部移动到新dom中
            if (vdom.base) {
                while (vdom.base.firstChild) {
                    out.appendChild(vdom.base.firstChild);
                }
                // 把新dom挂载到旧dom上的位置
                if (vdom.base.parentNode) {
                    vdom.base.parentNode.replaceChild(out, vdom.base);
                }
            }
            // 卸载旧dom 或者空白dom
            recollectNodeTree(vdom, true);
        }
        vdom = newVDom;
        vdom.normalizedNodeName = vnodeName;
    }
    const fc = out && out.firstChild;
    // 取出上次存放的props
    let props = vdom.props;
    // 获取虚拟的子节点
    const vchildren = (vnode as VNode).children;
    if (props == null || typeof props === "boolean") {
        // 上回的props不存在说明，这次一般为新建（preact有可能通过原生dom操作删除）
        vdom.props = props = {};
        // 把dom中的attributes也就是我们常见的setAttribute的属性，取出
        // 据说ie6-7的property也在attributes，就是style，id，class这种
        if (out && out.attributes) {
            for (let a = out.attributes, i = a.length; i-- ; ) {
                const attr = a[i];
                props[attr.name] = attr.value;
            }
        }
    }

    if (
        !hydrating
        && !isArray(vchildren)
        && typeof vchildren === "string"
        && fc != null
        && isTextNode(fc)
        && fc.nextSibling == null
    ) {
        // 如果未渲染过，且vnode的子元素和dom子元素长度都为1且为文本
        // 替换文本
        if (fc.nodeValue !== vchildren) {
            fc.nodeValue = String(vchildren);
        }
    } else if (vchildren || fc != null) {
        // vnode子元素需要渲染或者为空但dom子元素需要清空
        const childrenHydrating = hydrating || (typeof props === "object" && props[innerHTML] != null);
        diffChildren(
            vdom,
            vchildren,
            context,
            mountAll,
            childrenHydrating,
        );
    }
    // 设置dom属性
    diffAttributes(vdom, (vnode as VNode), props);
    // 把props存到dom上下文中
    // child[ATTR_KEY] = props;
    const oldVDom = findVDom(vdom.base);
    if (oldVDom !== vdom) {
        setVDom(vdom.base, vdom);
    }
    // 还原
    isSvgMode = prevSvgMode;
    return vdom;
}

/**
 * 比较子元素进行更新
 * @param vdom 原vdom
 * @param vchildren 虚拟子元素数组
 * @param context 上下文
 * @param mountAll 是否需要挂载
 * @param isHydrating 是否
 */
function diffChildren(
    vdom: IVDom,
    vchildren: childType[] | childType,
    context: any,
    mountAll: boolean,
    isHydrating: boolean,
) {
    // 取出上次的子元素
    const originalChildren = vdom.base && vdom.base.childNodes;
    const children: Array<IVDom|undefined> = [];
    const keyed: {
        [name: string]: IVDom | undefined;
    } = {};
    let keyedLen = 0;
    let min = 0;
    let childrenLen = 0;
    let vlen = 0;
    if (vchildren) {
        if (isArray(vchildren)) {
            vlen = (vchildren as childType[]).length;
        } else {
            vchildren = [vchildren as childType];
            vlen = 1;
        }
    }
    // const vlen = vchildren ? isArray(vchildren) ? (vchildren as childType[]).length : 1 : 0;
    let len = originalChildren ? originalChildren.length : 0;
    let j;
    let c;
    let f;
    let vchild: childType;
    let child: IVDom | null | undefined;
    const voidNodes: {[name: number]: IVDom} = findVoidNode(vdom.base);
    if (vdom.base && voidNodes) {
        setVoidNode(vdom.base, null);
    }
    let voidLen = -1;
    if (voidNodes) {
        for (const key in voidNodes) {
            const keynum = +key;
            voidLen = voidLen < keynum ? keynum : voidLen;
        }
        if (voidLen > -1) {
            voidLen += 1;
        }
    }
    if (len > 0) {
        let offset = 0;
        len = Math.max(len, voidLen);
        for (let i = 0; i < len; i++) {
            let pvdom: IVDom | undefined;
            let pchild;
            if (voidNodes && (i + offset) in voidNodes) {
                pvdom = voidNodes[i + offset];
                offset ++;
                i --;
                pchild = null;
            } else {
                pchild = (originalChildren as NodeList)[i];
                pvdom = pchild && findVDom(pchild);
            }
            const props = pvdom && pvdom.props;
            let key: string | undefined | number;
            if (pvdom && vlen > 0 && props) {
                if (pvdom.component) {
                    key = pvdom.component._key;
                } else if (typeof props === "object") {
                    key = props.key;
                }
            }
            // const key = pvdom && vlen && props ? pvdom.component ? pvdom.component._key : typeof props === "object" && props.key : null;
            if (key != null) {
                keyedLen++;
                keyed[key] = pvdom;
            } else if (
                props
                || (
                   pchild && isTextNode(pchild)
                    ? (isHydrating ? pchild.nodeValue && pchild.nodeValue.trim() : true)
                    : isHydrating
                )
                ) {
                children[childrenLen++] = pvdom || buildVDom(pchild as any);
            } else if (!pchild && pvdom && pvdom.component) {
                children[childrenLen++] = pvdom;
            }
        }
    } else if (voidNodes) {
        for (const key in voidNodes) {
            children[key] = voidNodes[key];
        }
    }
    if (vlen !== 0) {
        let offset = 0;
        for (let i = 0; i < vlen; i++) {
            vchild = (vchildren as childType[])[i];
            child = null;
            const key = vchild && typeof vchild === "object" && vchild.key;
            if (key != null && typeof key !== "boolean") {
                if (keyedLen && keyed[key] !== undefined) {
                    child = keyed[key];
                    keyed[key] = undefined;
                    keyedLen--;
                }
            } else if (!child && min < childrenLen) {
                for (j = min; j < childrenLen; j++) {
                    c = children[j];
                    if (c !== undefined && isSameNodeType(c, vchild, isHydrating)) {
                        child = c;
                        children[j] = undefined;
                        if (j === childrenLen - 1) {
                            childrenLen--;
                        }
                        if (j === min) {
                            min++;
                        }
                        break;
                    }
                }
            }
            // morph the matched/found/created DOM child to match vchild (deep)
            const pchild = idiff(child, vchild, context, mountAll, false);
            // 获取真实
            f = originalChildren && originalChildren[i + offset];
            if (pchild.base !== vdom.base && pchild.base !== f) {
                if (f == null && vdom.base && pchild.base) {
                    vdom.base.appendChild(pchild.base);
                } else if (f && pchild.base === f.nextSibling) {
                    // 处理组件卸载生命周期
                    const fvdom = findVDom(f as any);
                    if ( fvdom && fvdom.component) {
                        offset ++;
                    } else {
                        removeNode(f as any);
                    }
                } else {
                    if (vdom.base && pchild.base && f) {
                        vdom.base.insertBefore(pchild.base, f);
                    }
                }
            }
            if (vdom.base && !pchild.base && pchild.component) {
                let voidNode = findVoidNode(vdom.base);
                if (!voidNode) {
                    voidNode = {};
                    setVoidNode(vdom.base, voidNode);
                }
                voidNode[i] = pchild;
            }
        }
    }
    // remove unused keyed children:
    if (keyedLen) {
        for (const i in keyed) {
            const keyItem = keyed[i];
            if (keyItem != null) {
                recollectNodeTree(keyItem, false);
            }
        }
    }

    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
        child = children[childrenLen--];
        if (child !== undefined) {
            recollectNodeTree(child, false);
        }
    }
}

/** 递归回收(或者只是卸载一个)
 * @param node 要被卸载的dom
 * @param unmountOnly 为true则只触发生命周期，跳过删除(仅在dom上的组件索引不存在有效)
 */
export function recollectNodeTree(node: IVDom, unmountOnly: boolean) {
    // 获取dom上的组件索引
    const component = node.component;
    if (component) {
        // 如果存在
        unmountComponent(component);
        // node.component = undefined;
    } else {
        if (typeof node.props === "object") {
            // ref用于取消引用dom
            setRef(node.props.ref, null);
            // node.props.ref(null);
        }
        if ((unmountOnly === false || node.props == null) && node.base) {
            // 移除dom
            removeNode(node.base);
        }
        // 卸载子dom
        removeChildren(node);
    }
}

export function removeChildren(node: IVDom) {
    // 触发子元素的生命周期
    const voidNode = findVoidNode(node.base);
    if (voidNode) {
        for (const key in voidNode) {
            recollectNodeTree(voidNode[key], true);
        }
        setVoidNode(node.base, null);
    }
    let item = node.base && node.base.lastChild;
    while (item) {
        const next = item.previousSibling;
        const vdom: IVDom = findVDom(item) as IVDom || buildVDom(item);
        recollectNodeTree(vdom, true);
        item = next;
    }
}

function diffAttributes(vdom: IVDom, vnode: VNode, old: IKeyValue) {
    const attrs: IKeyValue | undefined = vnode.attributes;
    const component = vnode.component;
    const dom = vdom.base;
    let name: string;
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            const oldValue = old[name];
            const value: any = old[name] = undefined;
            setAccessor(vdom, name, oldValue, value, isSvgMode, component);
        }
    }
    if (attrs) {
        for (name in attrs) {
            if (
                name !== "children"
                && name !== "innerHTML"
                && (
                    !(name in old)
                    || attrs[name] !== (
                        name === "value"
                        || name === "checked"
                        ? (dom as any)[name]
                        : old[name]
                    )
                )
            ) {
                const oldValue = old[name];
                const value = old[name] = attrs[name];
                setAccessor(vdom, name, oldValue, value, isSvgMode, component);
            }
        }
    }
}
