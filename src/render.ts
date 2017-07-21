import { diff } from "./vdom/diff";
import { VNode } from "./vnode";
import { unmountComponent } from "./vdom/component";

const child = {};

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 */
export function render(vnode: VNode, parent: Element, merge: Element, domChild?: any) {
    const pchild = domChild || child;
    if (
        merge == null
        && pchild.base != null
    ) {
        // 原preact使用dom存放数据，现在，如果dom(merge)不存在，且pchild内有dom就卸载掉
        unmountComponent(pchild);
    }
    return diff(merge, vnode, {}, false, parent, false, pchild);
}
