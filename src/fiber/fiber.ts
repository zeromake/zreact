import { IVNode, IBaseProps, VNodeType } from "../core/type-shared";
import { extend } from "../core/util";
import { IFiber } from "./type-shared";
import { EffectTag } from "./effect-tag";

export class Fiber implements IFiber {
    public tag: number;
    public type: string | VNodeType;
    public props: IBaseProps;
    public effectTag: number;
    public children: {[key: string]: IFiber};
    public name: string;
    constructor(vnode: IVNode) {
        extend(this, vnode);
        const type = vnode.type || "ProxyComponent(react-hot-loader)";
        this.name = (type as any).displayName || (type as any).name || type;
        this.effectTag = EffectTag.NOWORK;
    }
}