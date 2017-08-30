import { diff } from "./vdom/diff";
import { IVNode } from "./vnode";
import { IVDom, buildVDom } from "./vdom/index";
import { defer } from "./util";
/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
export function render(vnode: IVNode, parent: Element, dom?: Element): Element | Node | Text {
    let vdom: IVDom | undefined;
    if (dom && (dom as any)._vdom) {
        vdom = (dom as any)._vdom;
    } else {
        vdom = buildVDom(dom);
    }
    const newVDom = diff(vdom, vnode, {}, false, parent, false);
    return newVDom.base;
}
