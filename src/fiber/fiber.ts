import { IVNode, IBaseProps, VNodeType } from "../core/type-shared";
import { IFiber } from "./type-shared";

export class Fiber implements IFiber {
    public tag: number;
    public type: string | VNodeType;
    public props: IBaseProps;
    public effectTag: number;
    constructor(vnode: IVNode) {
        Object.assign(this, vnode);
        this.effectTag = 1;
    }
}
