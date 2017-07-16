import { diff } from "./vdom/diff";

export function render(vnode, parent, merge) {
    return diff(merge, vnode, {}, false, parent, false);
}
