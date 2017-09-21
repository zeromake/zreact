import options from "../options";
// import { ATTR_KEY } from "../constants";
import { isSameNodeType, isNamedNode } from "./index";
import { VNode } from "../vnode";
import { Component } from "../component";
import { IKeyValue, childType } from "../types";
import { IVDom, buildVDom } from "./index";
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

export const mounts: Array<Component<any, any>> = [];

export let diffLevel = 0;

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
    vnode: VNode | void,
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
    if (parent && ret.base.parentNode !== parent) {
        parent.appendChild(ret.base);
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
    vnode: VNode | string | number | boolean | void,
    context: IKeyValue,
    mountAll: boolean,
    componentRoot?: boolean,
): IVDom {
    const prevSvgMode = isSvgMode;
    let out = vdom && vdom.base;

    if (vnode == null || typeof vnode === "boolean") {
        // 去除空，布尔值转为空字符串
        vnode = "";
    }
    if (typeof vnode === "string" || typeof vnode === "number") {
        // 文本节点处理
        if (
            vdom
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
                (dom as any)._vdom = newVDom;
            } catch (e) {
            }
            if (vdom) {
                // 如果有旧dom，就替换并卸载旧的。
                if (vdom.base.parentNode) {
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
    if (!vdom || !isNamedNode(vdom, vnodeName) || !out) {
        // 没有原dom或者原dom与vnode里的不同，新建一个
        out = createNode(vnodeName, isSvgMode);
        const newVDom: IVDom = {
            base: out,
        };
        (out as any)._vdom = newVDom;
        if (vdom) {
            // 旧dom存在时的一些处理
            // 把旧dom的子元素全部移动到新dom中
            while (vdom.base.firstChild) {
                out.appendChild(vdom.base.firstChild);
            }
            // 把新dom挂载到旧dom上的位置
            if (vdom.base.parentNode) {
                vdom.base.parentNode.replaceChild(out, vdom.base);
            }
            // 卸载旧dom
            recollectNodeTree(vdom, true);
        }
        vdom = newVDom;
        vdom.normalizedNodeName = vnodeName;
    }
    const fc = out.firstChild;
    // 取出上次存放的props
    let props = vdom.props;
    // 获取虚拟的子节点
    const vchildren = (vnode as VNode).children;
    if (props == null || typeof props === "boolean") {
        // 上回的props不存在说明，这次一般为新建（preact有可能通过原生dom操作删除）
        vdom.props = props = {};
        // 把dom中的attributes也就是我们常见的setAttribute的属性，取出
        // 据说ie6-7的property也在attributes，就是style，id，class这种
        for (let a = out.attributes, i = a.length; i-- ; ) {
            const attr = a[i];
            props[attr.name] = attr.value;
        }
    }
    if (
        !hydrating
        && vchildren
        && vchildren.length === 1
        && typeof vchildren[0] === "string"
        && fc != null
        && isTextNode(fc)
        && fc.nextSibling == null
    ) {
        // 如果未渲染过，且vnode的子元素和dom子元素长度都为1且为文本
        // 替换文本
        if (fc.nodeValue !== vchildren[0]) {
            fc.nodeValue = String(vchildren[0]);
        }
    } else if (vchildren && vchildren.length || fc != null) {
        // vnode子元素需要渲染或者为空但dom子元素需要清空
        const childrenHydrating = hydrating || (typeof props === "object" && props.dangerouslySetInnerHTML != null);
        diffChildren(
            vdom,
            vchildren as childType[],
            context,
            mountAll,
            childrenHydrating,
        );
    }
    // 设置dom属性
    diffAttributes(vdom, (vnode as VNode), props);
    // 把props存到dom上下文中
    // child[ATTR_KEY] = props;
    if ((vdom.base as any)._vdom !== vdom) {
        (vdom.base as any)._vdom = vdom;
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
    vchildren: childType[],
    context: any,
    mountAll: boolean,
    isHydrating: boolean,
) {
    // 取出上次的子元素
    const originalChildren = vdom.base.childNodes;
    const children: Array<IVDom|undefined> = [];
    const keyed: {
        [name: string]: IVDom | undefined;
    } = {};
    let keyedLen = 0;
    let min = 0;
    let childrenLen = 0;
    const vlen = vchildren ? vchildren.length : 0;
    const len = originalChildren.length;
    let j;
    let c;
    let f;
    let vchild: childType;
    let child: IVDom | null | undefined;

    if (len > 0) {
        for (let i = 0; i < len; i++) {
            const pchild = originalChildren[i];
            const pvdom: IVDom | undefined = pchild && (pchild as any)._vdom;
            const props = pvdom && pvdom.props;
            let key: string | undefined;
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
                    isTextNode(pchild)
                    ? (isHydrating ? pchild.nodeValue && pchild.nodeValue.trim() : true)
                    : isHydrating
                )
                ) {
                children[childrenLen++] = pvdom || buildVDom(pchild);
            }
        }
    }
    if (vlen !== 0) {
        for (let i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            const key = typeof vchild === "object" && vchild.key;
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
            f = originalChildren[i];
            if (pchild.base !== vdom.base && pchild.base !== f) {
                if (f == null) {
                    vdom.base.appendChild(pchild.base);
                } else if (pchild.base === f.nextSibling) {
                    // 处理组件卸载生命周期
                    // @developit I found it
                    // [vdom/diff.js#L228](https://github.com/developit/preact/blob/master/src/vdom/diff.js#L228)
                    // This has been uninstalled
                    // but componentWillUnmount triggered on:
                    // - [vdom/diff.js#L240](https://github.com/developit/preact/blob/master/src/vdom/diff.js#L240)
                    // - [vdom/diff.js#L245](https://github.com/developit/preact/blob/master/src/vdom/diff.js#L245)
                    // so top-level render and setState() are all the same
                    // ## Repair the code
                    // ``` javascript
                    // ```
                    const fvdom = (f as any)._vdom as IVDom;
                    if ( fvdom && fvdom.component) {
                        recollectNodeTree(fvdom, false);
                        const fkey = fvdom.component._key;
                        if (fkey && fkey in keyed) {
                            keyed[fkey] = undefined;
                        } else {
                            const findex = children.indexOf(fvdom);
                            if (findex > -1) {
                                children[findex] = undefined;
                            }
                        }
                    }
                    removeNode(f as any);
                } else {
                    vdom.base.insertBefore(pchild.base, f);
                }
            }
        }
    }
    // remove unused keyed children:
    if (keyedLen) {
        for (const i in keyed) {
            const keyItem = keyed[i];
            if (keyItem != null) {
                // console.log("---removeKey----", i, keyItem);
                // removeNode(keyed[i].base);
                recollectNodeTree(keyItem, false);
            }
        }
    }

    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
        child = children[childrenLen--];
        if (child !== undefined) {
            // console.log("---removeChildren----", child);
            // removeNode(child.base);
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
        if (typeof node.props === "object" && node.props.ref) {
            // ref用于取消引用dom
            node.props.ref(null);
        }
        if (unmountOnly === false || node.props == null) {
            // 移除dom
            removeNode(node.base);
        }
        // 卸载子dom
        removeChildren(node);
    }
}

export function removeChildren(node: IVDom) {
    // 触发子元素的生命周期
    let item = node.base.lastChild;
    while (item) {
        const next = item.previousSibling;
        const vdom: IVDom = (item as any)._vdom || buildVDom(item);
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

// function replaceVDomParent(oldVDom: IVDom, vdom: IVDom): void {
//     if (oldVDom.parent && oldVDom.parent.children) {
//         vdom.parent = oldVDom.parent;
//         const index = oldVDom.parent.children.indexOf(oldVDom);
//         if (index !== -1) {
//             oldVDom.parent.children[index] = vdom;
//         }
//     }
// }
