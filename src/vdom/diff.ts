import { ATTR_KEY } from "../constants";
import { isSameNodeType, isNamedNode } from "./index";
import { buildComponentFromVNode, unmountComponent, removeDomChild } from "./component";
import {
    setAccessor,
    createNode,
    removeNode,
    getPreviousSibling,
    getLastChild,
    isTextNode,
} from "../dom/index";
import options from "../options";
import { VNode } from "../vnode";
import { Component } from "../component";
import { IKeyValue } from "../types";

export const mounts: Component[] = [];

export let diffLevel = 0;

let isSvgMode = false;

let hydrating = false;

export function flushMounts() {
    let c = mounts.pop();
    while (c) {
        const afterMount = options.afterMount;
        if (afterMount) {
            afterMount(c);
        }
        if (c.componentDidMount) {
            c.componentDidMount();
        }
        c = mounts.pop();
    }
}

/**
 * 比较dom差异
 * @param dom 原dom
 * @param vnode jsx
 * @param context 通过render来的是一个空对象。
 * @param mountAll 是否已全部挂载
 * @param parent 挂载元素
 * @param componentRoot 是否为componentRoot
 */
export function diff(
    dom: Element | undefined,
    vnode: VNode | void,
    context: IKeyValue,
    mountAll: boolean,
    parent: any,
    componentRoot: boolean,
    child: any,
): Element {
    if (child.base && dom !== child.base) {
        // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
        removeDomChild(child);
    }
    if (!diffLevel++) {
        // 在diff调用递归层数为0时设置isSvgMode，hydrating
        isSvgMode = parent != null && parent.ownerSVGDocument !== undefined;
        hydrating = dom != null && !(child && child[ATTR_KEY]);
    }
    // 调用idiff生成dom
    const ret = idiff(
        dom,
        vnode,
        context,
        mountAll,
        componentRoot,
        child,
    );
    // 如果有父dom直接appendChild
    if (parent && ret.parentNode !== parent) {
        parent.appendChild(ret);
    }
    if (!--diffLevel) {
        // diff调用递归层为0
        hydrating = false;
        if (!componentRoot) {
            flushMounts();
        }
    }
    return ret;
}

function idiff(
    dom: any,
    vnode: any,
    context: IKeyValue,
    mountAll: boolean,
    componentRoot?: boolean,
    child?: any,
) {
    // if (child.base && dom !== child.base) {
    //     // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
    //     removeDomChild(child);
    // }
    let out = dom;
    const prevSvgMode = isSvgMode;

    if (vnode == null || typeof vnode === "boolean") {
        vnode = "";
    }
    if (typeof vnode === "string" || typeof vnode === "number") {
        if (
            dom
            && isTextNode(dom)
            && dom.parentNode
            && (!child._component || componentRoot)
        ) {
            if (dom.nodeValue !== vnode) {
                dom.nodeValue = vnode;
            }
        } else {
            const data: any = vnode;
            out = document.createTextNode(data);
            if (dom) {
                if (dom.parentNode) {
                    dom.parentNode.replaceChild(out, dom);
                }
                // if (child.base !== dom) {
                //     child.base = dom;
                // }
                recollectNodeTree(child, true);
            }
        }
        child[ATTR_KEY] = true;
        child.base = out;
        return out;
    }
    let vnodeName = vnode.nodeName;
    if (typeof vnodeName === "function") {
        return buildComponentFromVNode(dom, vnode, context, mountAll, child);
    }

    isSvgMode = vnodeName === "svg"
        ? true : vnodeName === "foreignObject" ? false : isSvgMode;
    vnodeName = String(vnodeName);
    if (!dom || !isNamedNode(dom, vnodeName)) {
        out = createNode(vnodeName, isSvgMode);
        if (dom) {
            while (dom.firstChild) {
                out.appendChild(dom.firstChild);
            }
            if (dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
            // if (child.base !== dom) {
            //     child.base = dom;
            // }
            recollectNodeTree(child, true);
        }
    }
    const fc = out.firstChild;
    let props = child[ATTR_KEY];
    const vchildren = vnode.children;
    if (props == null) {
        props = child[ATTR_KEY] = {};
        for (let a = out.attributes, i = a.length; i-- ; ) {
            const attr = a[i];
            props[attr.name] = attr.value;
        }
    }

    if (child.base !== out) {
        child.base = out;
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
        if (fc.nodeValue !== vchildren[0]) {
            fc.nodeValue = vchildren[0];
        }
    } else if (vchildren && vchildren.length || fc != null) {
        if (!child.children) {
            child.children = [];
        }
        innerDiffNode(
            out,
            vchildren,
            context,
            mountAll,
            hydrating || props.dangerouslySetInnerHTML != null,
            child,
        );
    }

    diffAttributes(out, vnode.attributes, props, child);
    isSvgMode = prevSvgMode;
    return out;
}

function innerDiffNode(
    dom: Node,
    vchildren: any[],
    context: any,
    mountAll: boolean,
    isHydrating: boolean,
    domChild: any,
) {
    let originalChildren = domChild.children;
    const children = [];
    const keyed: {
        [name: string]: any;
    } = {};
    let keyedLen = 0;
    let min = 0;
    let childrenLen = 0;
    const vlen = vchildren ? vchildren.length : 0;
    let j;
    let c;
    let f;
    let vchild;
    let child;
    const pchildren = [];
    const childNodes = dom.childNodes;
    const unChildren = [];

    if (childNodes.length !== originalChildren.length) {
        let offset = 0;
        const nodeList = childNodes;
        const nodeLen = nodeList.length;
        const newChildren = [];
        for (let i = 0; i < nodeLen; i++) {
            const node = nodeList[i];
            let vdom = originalChildren[i + offset];
            while (vdom && node !== vdom.base) {
                offset ++;
                vdom = originalChildren[i + offset];
            }
            if (vdom) {
                newChildren.push(vdom);
            } else {
                newChildren.push({
                    base: node,
                });
            }
        }
        originalChildren = newChildren;
    }
    const len = originalChildren.length;
    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
    for (let i = 0; i < len; i++) {
        const pchild: any = originalChildren[i];
        const props = pchild[ATTR_KEY];
        const key = vlen && props
            ? pchild._component
                ? pchild._component.__key
                : props.key
            : null;
        if (key != null) {
            keyedLen++;
            keyed[key] = pchild;
        } else if (
            props
            || (
                isTextNode(pchild.base)
                ? (isHydrating ? pchild.base.nodeValue.trim() : true)
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
            let tchild = null;
            // attempt to find a node based on key matching
            const key = vchild.key;
            if (key != null) {
                if (keyedLen && keyed[key] !== undefined) {
                    child = keyed[key];
                    keyed[key] = undefined;
                    keyedLen--;
                }
            } else if (!child && min < childrenLen) {
            // attempt to pluck a node of the same type from the existing children
                for (j = min; j < childrenLen; j++) {
                    c = children[j];
                    if (children[j] !== undefined && isSameNodeType(c, vchild, isHydrating)) {
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
            // 获取上一次的props存储对象
            tchild = child || {};
            // morph the matched/found/created DOM child to match vchild (deep)
            child = idiff(child && child.base, vchild, context, mountAll, false, tchild);
            // 把新的props存储对象存储起来
            pchildren.push(tchild);
            // 获取真实
            f = childNodes[i];
            if (child && child !== dom && child !== f) {
                if (f == null) {
                    dom.appendChild(child);
                } else if (child === f.nextSibling) {
                    const t: any = f;
                    removeNode(t);
                } else {
                    dom.insertBefore(child, f);
                }
            }
        }
    }
    domChild.children = pchildren;
    // remove unused keyed children:
    if (keyedLen) {
        for (const i in keyed) {
            if (keyed[i] !== undefined) {
                // removeNode(keyed[i].base);
                recollectNodeTree(keyed[i], false);
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
export function recollectNodeTree(node: any, unmountOnly: any) {
    // 获取dom上的组件索引
    const component = node._component;
    if (component) {
        // 如果存在
        unmountComponent(component);
        node._component = null;
        removeDomChild(node);
    } else {
        if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) {
            // ref用于取消引用dom
            node[ATTR_KEY].ref(null);
        }
        if (unmountOnly === false || node[ATTR_KEY] == null) {
            // 移除dom
            removeNode(node.base);
        }
        // 卸载子dom
        removeChildren(node);
    }
}

export function removeChildren(node: any) {
    // 去除最后一个子元素
    const nodeList = node.children;
    node.children = [];
    let len = nodeList ? nodeList.length : 0;
    // node = getLastChild(node && node.base);
    while (len--) {
        // 不需要移除因为父级已经移除
        recollectNodeTree(nodeList[len], true);
    }
    // removeDomChild
    removeDomChild(node);
}

function diffAttributes(dom: any, attrs: any, old: any, child: any) {
    let name: string;
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            const oldValue = old[name];
            const value = old[name] = undefined;
            setAccessor(dom, name, oldValue, value, isSvgMode, child);
        }
    }
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
            setAccessor(dom, name, oldValue, value, isSvgMode, child);
        }
    }

}
