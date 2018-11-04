import { IVNode, IComponentMinx, IBaseProps, IBaseObject, IOwnerAttribute, OwnerType } from "../core/type-shared";
import { EffectTag } from "./effect-tag";

export interface IUpdateQueue {
    pendingStates: Array<IBaseObject|((state: IBaseObject, props: IBaseProps) => IBaseObject)>;
    pendingCbs: Array<() => void>;
    isForced?: boolean;
    batching?: any;
}

export interface IFiber extends IVNode {
    /**
     * 组件名
     */
    name: string;
    stateNode?: OwnerType;
    /**
     * 多子组件的 map {[key: string]: fiber}
     */
    children: {[key: string]: IFiber};
    oldChildren?: {[key: string]: IFiber};
    lastProps?: IBaseProps;
    /**
     * 父节点
     */
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
    parent?: OwnerType;
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
    effects?: IFiber[];
    /**
     * 组建是否废弃
     */
    disposed?: boolean;
    /**
     * 是否删除 ref
     */
    deleteRef?: boolean;
    updateQueue?: IUpdateQueue;
    forwardFiber?: IFiber;
    insertPoint?: IFiber;
    batching?: any;
    updateFail?: boolean;
    shiftContainer?: any;
    shiftContext?: boolean;
    memoizedState?: IBaseObject;
    memoizedProps?: IBaseProps;
    setout?: boolean;
    dirty?: boolean;
    pendingCbs?: Array<() => void>;
    hostRoot?: boolean;
    index?: number;
    microtasks?: IFiber[];
    containerStack?: OwnerType[];
    contextStack?: IBaseObject[];
}

export interface IScheduledCallbackParams {
    didTimeout: boolean;
    timeRemaining(): number;
}
export type scheduledCallbackType = (params: IScheduledCallbackParams) => () => void;
export interface IScheduledConfig {
    scheduledCallback: scheduledCallbackType;
    timeoutTime: number;
    next: IScheduledConfig|null;
    prev: IScheduledConfig|null;
}

export interface IScheduledOptions {
    timeout: number;
}
