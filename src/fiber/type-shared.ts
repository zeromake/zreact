import { IVNode } from "../core/type-shared";

export interface IFiber extends IVNode {
    nodeType?: any;
    stateNode?: Element|Node|IFiber;
    refs?: any;
    render?: any;
    effectTag: number;
}
