import { diff } from "./vdom/diff";
import { VNode } from "./vnode";
import { IVDom, buildVDom } from "./vdom/index";
// import { defer } from "./util";
import { findVDom } from "./find";
import { Component } from "./component";

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
export function render(vnode: VNode, parent: Element, dom?: Element): Element | Node | Text | Component<any, any> {
    let vdom: IVDom | undefined = findVDom(dom);
    if (!vdom) {
        vdom = buildVDom(dom);
    }
    const newVDom = diff(vdom, vnode, {}, false, parent, false);
    return newVDom.base || newVDom.component as Component<any, any>;
}
