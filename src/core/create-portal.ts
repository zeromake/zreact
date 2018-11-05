import { IBaseProps, ChildrenType } from "./type-shared";
import { createElement } from "./create-element";

/**
 * 在框架内部使用的无状态组件用于创建传送门
 * @param props
 */
export function Portal(props: IBaseProps): any {
    return props.children;
}
/**
 * 创建一个传送门
 * @param children
 * @param parent 父 dom
 */
export function createPortal(children: ChildrenType, parent: Element|Node) {
    const vnode = createElement(Portal, { children, parent });
    vnode.isPortal = true;
    return vnode;
}
