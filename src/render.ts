import { diff } from "./vdom/diff";
import { VNode } from "./vnode";
import { VDom } from "./vdom/index";

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
export function render(vnode: VNode, parent: Element, vdom: VDom): VDom {
    const base = diff(vdom, vnode, {}, false, parent, false);
    return base;
}
