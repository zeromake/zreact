import { IFiber } from "../fiber/type-shared";

/**
 * createRef
 */
export interface IObjectRef {
    current: RefElement;
}
export type RefElement = Element | Node | OwnerType | null;
export type IRefFun = (node: RefElement) => any;

export type IRefType = IObjectRef | string | IRefFun;

export interface IWorkContext {
    contextStack: IBaseObject[];
    containerStack: OwnerType[];
}
export interface IOwnerAttribute {
    /**
     * fiber 实例
     */
    $reactInternalFiber?: IFiber;
    /**
     * 组件更新器
     */
    updater?: IUpdater;
    /**
     * 获取组件实例或者 dom 对象
     */
    ref?: IRefType;
    /**
     * render 时传递的属性
     */
    props?: Readonly<IBaseProps>|null;
    /**
     * 父组件传递的上下文
     */
    context?: object;
    /**
     * render 生成 vnode
     */
    /**
     * 是否为无状态组件
     */
    $isStateless?: boolean;
    /**
     * 无状态组件是否在初始化
     */
    $init?: boolean;
    $useNewHooks?: boolean;
    insertPoint?: IFiber|null;
    state?: IBaseObject;
    $unmaskedContext?: IBaseObject;
    $maskedContext?: IBaseObject;
    setState?: any;
    render?(): VirtualNode[] | VirtualNode;
    renderImpl?(p: IBaseProps): VirtualNode[] | VirtualNode;
    getChildContext?(): IBaseObject;
    forceUpdate?(cb: () => void): void;
}

export interface IAnuElement extends Element, IOwnerAttribute {
    $reactInternalFiber?: IFiber;
}

export type OwnerType = IOwnerAttribute | IComponentMinx<IBaseProps, IBaseObject> | IAnuElement;

export interface IVNode {
    $$typeof?: symbol | number;
    /**
     * vnode 的类型
     */
    tag: number;
    /**
     * dom名或组件class|function
     */
    type: string | VNodeType;
    /**
     * 组件参数
     */
    props: IBaseProps;
    $owner?: OwnerType | null;
    key?: string | null;
    /**
     * ref 获取组件实例
     */
    ref?: IRefType;
    text?: string;
    /**
     * 是否为传送门
     */
    isPortal?: boolean;
}

type VNode =
    | IVNode
    | string
    | number
    | boolean
    | undefined
    | void
    | null;

export type VirtualNode = VNode | VirtualNodeFun | VNode[];

export type VirtualNodeFun = (...args: any[]) => ChildrenType;

export interface IBaseObject {
    [name: string]: any;
}

export type VirtualNodeList = Array<
    VirtualNode
    |VirtualNode[]
    |(VirtualNode[][])
>;

export type ChildrenType = VirtualNode|VirtualNodeList;

export interface IBaseProps extends IBaseObject {
    children?: ChildrenType;
    ref?: IRefType;
    key?: string | number | undefined;
    className?: string;
}

export interface IComponentLifecycle<P extends IBaseProps, S extends IBaseObject> {
    // new(props?: P, context?: IBaseObject);
    /**
     * 初始化组件渲染到 dom 前
     * @deprecated
     */
    componentWillMount?(): void;
    /**
     * 初始化组件渲染之后
     */
    componentDidMount?(): void;
    /**
     * 在新的 props 合并前, setState不会触发
     * @param nextProps 新的 props
     * @param nextContext 新的 context
     * @deprecated
     */
    componentWillReceiveProps?(nextProps: Readonly<P>, nextContext?: IBaseObject): void;
    /**
     * 在 render() 之前. 若返回 false，则跳过 render
     * @param nextProps
     * @param nextState
     * @param nextContext
     */
    shouldComponentUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): boolean;
    /**
     * 在新一轮 render 之前，所有的更新操作都会触发。
     * @param nextProps 新的 props
     * @param nextState 新的 state
     * @param nextContext 新的 context
     */
    componentWillUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): void;
    /**
     * 在一次 render 完成后
     * @param preProps 上次 props
     * @param preState 上次 state
     * @param snapshot getSnapshotBeforeUpdate新api
     * @param preContext 上次 context
     */
    componentDidUpdate?(
        prevProps: Readonly<P>,
        prevState: Readonly<S>,
        snapshot?: any,
        prevContext?: IBaseObject,
    ): void;
    /**
     * 卸载dom前
     */
    componentWillUnmount?(): void;
    /**
     * 渲染错误回调
     * @param error
     */
    componentDidCatch?(error?: Error, stack?: {componentStack: string}): void;
    /**
     * 渲染后调用，返回的值注入 componentWillUpdate
     * @param prevProps
     * @param prevState
     */
    getSnapshotBeforeUpdate?(prevProps: P, prevState: S): any;
}

export interface IUpdater {
    /**
     * 挂载顺序
     */
    mountOrder: number;
    prevProps?: IBaseObject;
    prevState?: IBaseProps;
    snapshot?: any;
    /**
     * 触发 state 变化
     * @param component 组件实例
     * @param state
     * @param cb 回调
     */
    enqueueSetState(
        component: OwnerType,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb?: () => void,
    ): boolean;
    isMounted(component: OwnerType): boolean;
}

export interface IComponentMinx<P extends IBaseProps, S extends IBaseObject> extends IComponentLifecycle<P, S> {
    getChildContext?(): IBaseObject;
    isReactComponent?(): boolean;
    isMounted(): boolean;
    replaceState(): void;
    setState(state: S | ((s: S) => S | void), cb: () => void): void | S;
    forceUpdate(cb: () => void): void;
    render(): VirtualNode[] | VirtualNode;
}

export abstract class IComponentMinx<P extends IBaseProps, S extends IBaseObject> implements IOwnerAttribute {
    public static displayName?: string;
    public static defaultProps?: IBaseProps;
    public static getDerivedStateFromProps?(nextProps: IBaseProps, preState: IBaseObject): IBaseObject | null | undefined;
    public abstract state: Readonly<S>;
    public abstract props: Readonly<P>|null;
    public abstract context?: IBaseObject;
    public abstract $reactInternalFiber?: IFiber;
    public abstract updater: IUpdater;
    public abstract $useNewHooks?: boolean;

    public abstract $isStateless?: boolean;
    public abstract insertPoint?: IFiber|null;

    public abstract $unmaskedContext?: IBaseObject;
    public abstract $maskedContext?: IBaseObject;

    constructor(p?: P, c?: IBaseObject) {}

}
export interface IComponentClass<P extends IBaseProps, S extends IBaseObject> {
    prototype: IComponentMinx<P, S>;
    new(p: P, c: IBaseObject): IComponentMinx<P, S>;
}

export type IComponentFunction = (props: IBaseProps, ref?: IRefType) => VirtualNode[] | VirtualNode;

export type VNodeType = IComponentClass<IBaseProps, IBaseObject> | IComponentFunction | string;

// export const enum VType {
//     Text = 1,
//     Node = 1 << 1,
//     Composite = 1 << 2,
//     Stateless = 1 << 3,
//     Void = 1 << 4,
//     Portal = 1 << 5,
// }

export interface IMiddleware {
    begin: () => void;
    end: () => void;
}

export interface IRenderer {
    controlledCbs: any[];
    mountOrder: number;
    macrotasks: IFiber[];
    boundaries: IFiber[];
    currentOwner: OwnerType|null;
    catchError?: any;
    catchStack?: string;
    inserting?: HTMLOrSVGElement;
    eventSystem?: any;
    batchedUpdates?: (call: () => void, options: object) => void;
    // onUpdate(fiber: IFiber): any;
    onBeforeRender?(fiber: IFiber): void;
    onAfterRender?(fiber: IFiber): void;
    onDispose(fiber: IFiber): void;
    middleware(middleware: IMiddleware): void;
    updateControlled(fiber: IFiber): void;
    fireMiddlewares(begin?: boolean): void;
    updateComponent?(
        component: OwnerType,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb?: () => void,
        immediateUpdate?: boolean,
    ): any;
    scheduleWork?(): void;
    removeElement?(fiber: IFiber): void;
    createElement(fiber: IFiber): OwnerType;
    emptyElement?(fiber: IFiber): void;
    render?(vnode: IVNode, root: Element, callback?: () => void): Element;
    // [name: string]: any;
}
