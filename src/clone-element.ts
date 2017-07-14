import { h } from "./h";
import { VNode } from "./vnode";

export function cloneElement(vnode: VNode, props: any, ...children: any[]) {
    return h(
        vnode.nodeName,
        { ...{ ...vnode.attributes }, ...props },
        children.length > 2 ? children : vnode.children,
    );
}
