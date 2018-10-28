import { IVNode, IComponentMinx, IBaseProps, IBaseObject, IOwnerAttribute } from "../core/type-shared";
import { EffectTag } from "./effect-tag";

export interface IFiber extends IVNode {
    /**
     * 组件名
     */
    name: string;
    nodeType?: any;
    stateNode?: Element|Node|IComponentMinx<IBaseProps, IBaseObject>|IOwnerAttribute;
    /**
     * 多子组件的 map {[key: string]: fiber}
     */
    children: {[key: string]: IFiber};
    return?: IFiber;
    /**
     * 备用
     */
    alternate?: IFiber;
    /**
     * 上一个兄弟节点
     */
    forward?: IFiber;
    /**
     * 下一个兄弟节点
     */
    sibling?: IFiber;
    /**
     * 第一个子组件
     */
    child?: IFiber;
    /**
     * 父级组件实例
     */
    parent?: Element|Node|IComponentMinx<IBaseProps, IBaseObject>|IOwnerAttribute;
    // $reactInternalFiber?: IFiber;
    /**
     * 最后一个子组件
     */
    lastChild?: IFiber;
    // refs?: any;
    effectTag: EffectTag;
    /**
     * 是否已挂载
     */
    hasMounted?: boolean;
    $hydrating?: boolean;
    /**
     * 捕捉的 error
     */
    catchError?: any;
    /**
     * 发生错误的生命周期名
     */
    errorHook?: string;
    capturedValues?: any[];
    caughtError?: boolean;
    effects?: string[];
    /**
     * 组建是否废弃
     */
    disposed?: boolean;
    /**
     * 是否删除 ref
     */
    deleteRef?: boolean;
}
