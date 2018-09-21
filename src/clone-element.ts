import { createElement } from "./create-element";
import { VNode } from "./vnode";
import { extend } from "./util";

/**
 * 通过VNode对象新建一个自定义的props，children的VNode对象
 * @param vnode 旧vnode
 * @param props 新的props
 * @param children 新的子组件
 */
export function cloneElement(vnode: VNode, props: any, ...newChildren: any[]) {
    const { children, ...oldProps } = vnode.props;
    const child: any = newChildren.length > 0 ? newChildren : children;
    return createElement(
        vnode.type,
        {...oldProps, ...props},
        child,
    );
}
