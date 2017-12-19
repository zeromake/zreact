import { Component } from "./component";
import options from "./options";
import { defer } from "./util";
import { renderComponent } from "./vdom/component";
import { IKeyValue } from "./types";

let items: Array<Component<IKeyValue, IKeyValue>> = [];

/**
 * 把Component放入队列中等待更新
 * @param component 组件
 */
export function enqueueRender(component: Component<any, any>) {
    if (!component._dirty) {
        // 防止多次render
        component._dirty = true;
        const len = items.push(component);
        if (len === 1) {
            // 在第一次时添加一个异步render，保证同步代码执行完只有一个异步render。
            const deferFun = options.debounceRendering || defer;
            deferFun(rerender);
        }
    }
}

/**
 * 根据Component队列更新dom。
 * 可以setState后直接执行这个方法强制同步更新dom
 */
export function rerender() {
    let p: Component<IKeyValue, IKeyValue> | undefined;
    const list = items;
    items = [];
    while (p = list.pop()) {
        if (p._dirty) {
            // 防止多次render。
            renderComponent(p);
        }
    }
}
