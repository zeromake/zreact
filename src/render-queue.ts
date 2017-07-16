import { Component } from "./component";
import options from "./options";
import { defer } from "./util";
import { renderComponent } from "./vdom/component";

let items: Component[] = [];

export function enqueueRender(component: Component) {
    if (!component._dirty) {
        component._dirty = true;
        const len = items.push(component);
        if (len === 1) {
            const deferFun = options.debounceRendering || defer;
            deferFun(rerender);
        }
    }
}

export function rerender() {
    let p: Component;
    const list = items;
    items = [];
    p = list.pop();
    while (p) {
        if (p._dirty) {
            renderComponent(p);
        }
        p = list.pop();
    }
}
