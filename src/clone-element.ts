import { h } from "./h";
import { VNode } from "./vnode";
import { extend } from "./util";

export function cloneElement(vnode: VNode, props: any, ...children: any[]) {
    const child: any = children.length > 2 ? children : vnode.children;
    return h(
        vnode.nodeName,
        extend({}, vnode.attributes, props),
        child,
    );
}
