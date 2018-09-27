/**
 * createRef
 */
export interface IObjectRef {
    current: RefElement;
}
export type RefElement = Element | Node | IComponentMinx<IBaseProps, IBaseObject> | null;
export type IRefFun = (node: RefElement) => any;

export type IRefType = IObjectRef | string | IRefFun;

export interface IVNode {
    $$typeof?: symbol | number;
    tag: number;
    type: string | VNodeType;
    props: IBaseProps;
    $owner?: IVNode | null;
    key?: string;
    ref?: IRefType;
    text?: string;
    isPortal?: boolean;
}

export type VirtualNode =
    | IVNode
    | string
    | undefined
    | void
    | null
    | number;

export interface IBaseObject {
    [name: string]: any;
}

export type VirtualNodeList = Array<VirtualNode|VirtualNode[]>;

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
    componentDidCatch?(error?: Error): void;
    /**
     * 渲染后调用，返回的值注入 componentWillUpdate
     * @param prevProps
     * @param prevState
     */
    getSnapshotBeforeUpdate?(prevProps: P, prevState: S): any;
}

export interface IUpdater {
    enqueuSetState(
        component: IComponentMinx<any, any>,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb: () => void,
    ): boolean;
    isMounted(component: IComponentMinx<any, any>): boolean;
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

export interface IComponentClass<P extends IBaseProps, S extends IBaseObject> {
    defaultProps?: IBaseObject;
    new(p: P, c: IBaseObject): IComponentMinx<P, S>;
    getDerivedStateFromProps?(nextProps: P, preState: S): S | null | undefined;
}

export type IComponentFunction = (props: IBaseProps) => ChildrenType;

export type VNodeType = IComponentClass<IBaseProps, IBaseObject> | IComponentFunction | string;

export const enum VType {
    Text = 1,
    Node = 1 << 1,
    Composite = 1 << 2,
    Stateless = 1 << 3,
    Void = 1 << 4,
    Portal = 1 << 5,
}

export interface IMiddleware {
    begin: () => any;
    end: () => any;
}

export interface IRenderer {
    controlledCbs: any[];
    mountOrder: number;
    macrotasks: any[];
    boundaries: any[];
    currentOwner: IVNode;
    onUpdate(): any;
    onDispose(): any;
    middleware(middleware: IMiddleware): void;
    updateControlled(): void;
    fireMiddlewares(begin?: boolean): void;
    [name: string]: any;
}
