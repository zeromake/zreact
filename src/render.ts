import { diff } from "./vdom/diff";
import { VNode } from "./vnode";
import { VDom } from "./vdom/index";
import { initDevTools } from "./devtools1";

declare const DEVTOOLS_ENV: string;
declare const ENV: string;
declare const window: {
    $zreact: VDom;
    ZREACT_DEV: any;
};

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
export function render(vnode: VNode, parent: Element, vdom: VDom): VDom {
    const base = diff(vdom, vnode, {}, false, parent, false);
    if (DEVTOOLS_ENV !== "production") {
        if (window.ZREACT_DEV) {
            window.ZREACT_DEV();
        }
        window.ZREACT_DEV = initDevTools(base);
    } else if (ENV !== "production") {
        const dom: any = base.base;
        dom._vdom = base;
        // window.$zreact = base;
    }
    return base;
}
