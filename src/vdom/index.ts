import { VNode } from "../vnode";

export function getNodeProps(vnode: VNode) {
    const props = { ...vnode.attributes };
    props.children = vnode.children;

    const defaultProps = vnode.nodeName.defaultProps;
    if (defaultProps !== undefined) {
        for (const i in defaultProps) {
            if (props[i] === undefined) {
                props[i] = defaultProps[i];
            }
        }
    }
    return props;
}
