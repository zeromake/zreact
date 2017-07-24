import { h } from "./h";
import { VNode } from "./vnode";
import { extend } from "./util";

export function cloneElement(vnode: VNode, props: any, ...children: any[]) {
    return h(
        vnode.nodeName,
        extend({}, vnode.attributes, props),
        children.length > 2 ? children : vnode.children,
    );
}
