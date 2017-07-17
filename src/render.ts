import { diff } from "./vdom/diff";
import { VNode } from "./vnode";

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 */
export function render(vnode: VNode, parent: Element, merge: Element) {
    return diff(merge, vnode, {}, false, parent, false);
}
