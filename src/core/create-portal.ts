import { IBaseProps, ChildrenType } from "./type-shared";
import { createElement } from "./create-element";

export function Portal(props: IBaseProps): any {
    return props.children;
}

export function createPortal(children: ChildrenType, parent: Element|Node) {
    const vnode = createElement(Portal, { children, parent });
    vnode.isPortal = true;
    return vnode;
}
