import { diff } from "./vdom/diff";
import { IVNode } from "./vnode";
import { IVDom } from "./vdom/index";
import { initDevTools } from "./devtools";
import { Scheduling } from "./util";

declare const DEVTOOLS_ENV: string;
declare const ENV: string;
declare const window: {
    $zreact: IVDom;
    ZREACT_DEV: any;
    Map: any;
};

let isScheduling = false;

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
export function render(vnode: IVNode, parent: Element, vdom: IVDom): IVDom {
    const newVDom = diff(vdom, vnode, {}, false, parent, false);
    if (DEVTOOLS_ENV !== "production") {
        if (!window.ZREACT_DEV && !isScheduling && typeof window.Map === "function") {
            // window.ZREACT_DEV();
            isScheduling = true;
            Scheduling.rIC(() => {
                window.ZREACT_DEV = initDevTools(newVDom);
                isScheduling = false;
            });
        }
    } else if (ENV !== "production") {
        const dom: any = newVDom.base;
        dom._vdom = newVDom;
        // window.$zreact = base;
    }
    return newVDom;
}
