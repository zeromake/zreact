import { VNode } from "../vnode";
import { Component } from "../component";

export function isSameNodeType(node: any, vnode: VNode, hydrating: boolean) {
    if (typeof vnode === "string" || typeof vnode === "number") {
        return node.splitText !== undefined;
    }
    if (typeof vnode.nodeName === "string") {
        return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
    }
    return hydrating || node._componentConstructor === vnode.nodeName;
}

/** Check if an Element has a given normalized name.
 * @param {Element} node
 * @param {String} nodeName
 */
export function isNamedNode(
    node: { normalizedNodeName: string, nodeName: string },
    nodeName: string,
) {
    return node.normalizedNodeName === nodeName
        || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

export function getNodeProps(vnode: VNode) {
    const props = { ...vnode.attributes };
    props.children = vnode.children;
    const nodeName: any = vnode.nodeName;
    const defaultProps = nodeName.defaultProps;
    if (defaultProps !== undefined) {
        for (const i in defaultProps) {
            if (props[i] === undefined) {
                props[i] = defaultProps[i];
            }
        }
    }
    return props;
}
