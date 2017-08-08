import options from "../options";
import { ATTR_KEY } from "../constants";
import { isSameNodeType, isNamedNode } from "./index";
import { VNode } from "../vnode";
import { Component } from "../component";
import { IKeyValue } from "../types";
import { VDom } from "./index";
import { Scheduling } from "../util";
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
    vdom: VDom | undefined,
    vnode: VNode,
    context: IKeyValue,
    mountAll: boolean,
    parent: any,
    componentRoot: boolean,
): VDom {
    // if (child.base && dom !== child.base) {
    //     // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
    //     removeDomChild(child);
    // }
    if (!diffLevel++) {
        // 在diff调用递归层数为0时设置isSvgMode，hydrating
        // 判断是否为svg
        isSvgMode = parent != null && parent.ownerSVGDocument !== undefined;
        // 判断是否在上次渲染过了
        hydrating = vdom != null && !(vdom.props);
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
    vdom: VDom | undefined | null,
    vnode: VNode|string|number|boolean,
    context: IKeyValue,
    mountAll: boolean,
    componentRoot?: boolean,
): VDom {
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
            const newVDom = new VDom(dom);
            if (vdom) {
                // 来自renderComponent判断并处理vdom的子vdom更换
                if (componentRoot) {
                    replaceVDomParent(vdom, newVDom);
                }
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
    let vnodeName = vnode.nodeName;
    if (typeof vnodeName === "function") {
        // 是一个组件,创建或复用组件实例，返回dom
        return buildComponentFromVNode(vdom, vnode, context, mountAll);
    }
    // 重新判断一下是否要创建svg
    isSvgMode = vnodeName === "svg"
        ? true : vnodeName === "foreignObject" ? false : isSvgMode;
    // 一般通过babel的jsx无法发生非字符串的vnodeName
    vnodeName = String(vnodeName);
    if (!vdom || !isNamedNode(vdom, vnodeName) || !out) {
        // 没有原dom或者原dom与vnode里的不同，新建一个
        out = createNode(vnodeName, isSvgMode);
        const newVDom = new VDom(out);
        if (vdom) {
            // 来自renderComponent判断并处理vdom的子vdom更换
            if (componentRoot) {
                replaceVDomParent(vdom, newVDom);
            }
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
    const vchildren = vnode.children;
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

    // if (vdom.base !== out) {
    //     vdom.base = out;
    // }
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
        if (vdom.children == null) {
            vdom.children = [];
        }
        // vnode子元素需要渲染或者为空但dom子元素需要清空
        const childrenHydrating = hydrating || (typeof props === "object" && props.dangerouslySetInnerHTML != null);

        diffChildren(
            vdom,
            vchildren,
            context,
            mountAll,
            childrenHydrating,
        );
    }
    // 设置dom属性
    diffAttributes(vdom, vnode.attributes, props);
    // 把props存到dom上下文中
    // child[ATTR_KEY] = props;
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
    vdom: VDom,
    vchildren: Array<string|number|boolean|VNode>,
    context: any,
    mountAll: boolean,
    isHydrating: boolean,
) {
    // 取出上次的子元素
    let originalChildren = vdom.children || [];
    const children: Array<VDom|undefined> = [];
    const keyed: {
        [name: string]: VDom | undefined;
    } = {};
    let keyedLen = 0;
    let min = 0;
    let childrenLen = 0;
    const vlen = vchildren ? vchildren.length : 0;
    let j;
    let c;
    let f;
    let vchild: string|number|boolean|VNode;
    let child: VDom | null | undefined;
    const pchildren: VDom[] = [];
    const childNodes = vdom.base && vdom.base.childNodes;
    const unChildren = [];
    // 处理真实子元素与上次的dom上下文中存放的子元素数量不对的情况
    // 这种方式只能处理原生添加dom和删除dom。
    if (childNodes.length !== originalChildren.length) {
        let offset = 0;
        const nodeList = childNodes;
        const nodeLen = nodeList.length;
        const newChildren: VDom[] = [];
        for (let i = 0; i < nodeLen; i++) {
            const node = nodeList[i];
            let childVdom = originalChildren[i + offset];
            while (childVdom && node !== childVdom.base) {
                offset ++;
                childVdom = originalChildren[i + offset];
            }
            if (childVdom) {
                newChildren.push(childVdom);
            } else {
                const newVdom = new VDom(node);
                newChildren.push(newVdom);
            }
        }
        originalChildren = newChildren;
    }
    const len = originalChildren.length;
    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
    for (let i = 0; i < len; i++) {
        const pchild = originalChildren[i];
        const props = pchild.props;
        const key = vlen && props
            ? pchild.component
                ? pchild.component._key
                : typeof props === "object" && props.key
            : null;
        if (key != null) {
            keyedLen++;
            keyed[key] = pchild;
        } else if (
            props
            || (
                isTextNode(pchild.base)
                ? (isHydrating ? pchild.base.nodeValue && pchild.base.nodeValue.trim() : true)
                : isHydrating
            )
            ) {
            children[childrenLen++] = pchild;
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
            if (pchild.parent !== vdom) {
                pchild.parent = vdom;
            }
            // 把新的props存储对象存储起来
            pchildren.push(pchild);
            // 获取真实
            f = childNodes[i];
            if (pchild.base !== vdom.base && pchild.base !== f) {
                if (f == null) {
                    vdom.base.appendChild(pchild.base);
                } else if (pchild.base === f.nextSibling) {
                    const t: any = f;
                    removeNode(t);
                } else {
                    vdom.base.insertBefore(pchild.base, f);
                }
            }
        }
    }
    vdom.children = pchildren;
    // remove unused keyed children:
    if (keyedLen) {
        for (const i in keyed) {
            const keyItem = keyed[i];
            if (keyItem != null) {
                // removeNode(keyed[i].base);
                recollectNodeTree(keyItem, false);
            }
        }
    }

    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
        child = children[childrenLen--];
        if (child !== undefined) {
            // removeNode(child.base);
            recollectNodeTree(child, false);
        }
    }
}
/** 递归回收(或者只是卸载一个)
 * @param node 要被卸载的dom
 * @param unmountOnly 为true则只触发生命周期，跳过删除(仅在dom上的组件索引不存在有效)
 */
export function recollectNodeTree(node: VDom, unmountOnly: boolean) {
    // 获取dom上的组件索引
    const component = node.component;
    if (component) {
        // 如果存在
        unmountComponent(component);
        node.component = undefined;
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

export function removeChildren(node: VDom) {
    // 去除最后一个子元素
    const nodeList = node.children;
    node.children = undefined;
    let len = nodeList ? nodeList.length : 0;
    // node = getLastChild(node && node.base);
    while (nodeList && len--) {
        // 不需要移除因为父级已经移除
        recollectNodeTree(nodeList[len], true);
    }
}

function diffAttributes(vdom: VDom, attrs: IKeyValue | undefined, old: IKeyValue) {
    const dom: any = vdom.base;
    let name: string;
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            const oldValue = old[name];
            const value = old[name] = undefined;
            setAccessor(vdom, name, oldValue, value, isSvgMode);
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
                        ? dom[name]
                        : old[name]
                    )
                )
            ) {
                const oldValue = old[name];
                const value = old[name] = attrs[name];
                setAccessor(vdom, name, oldValue, value, isSvgMode);
            }
        }
    }
}

function replaceVDomParent(oldVDom: VDom, vdom: VDom): void {
    if (oldVDom.parent && oldVDom.parent.children) {
        vdom.parent = oldVDom.parent;
        const index = oldVDom.parent.children.indexOf(oldVDom);
        if (index !== -1) {
            oldVDom.parent.children[index] = vdom;
        }
    }
}
