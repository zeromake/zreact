import { diff } from "./vdom/diff";
import { VNode } from "./vnode";

const child = {};

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 */
export function render(vnode: VNode, parent: Element, merge: Element, domChild?: any) {
    const pchild = domChild || child;
    const base: any = diff(merge, vnode, {}, false, parent, false, pchild);
    if (pchild._component) {
        base._component = pchild._component;
    }
    return base;
}
