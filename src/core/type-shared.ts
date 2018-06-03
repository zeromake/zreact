
type RefElement = Element | Node;

interface IObjectRef {
    value: RefElement
}

interface VNode {
    vtype: number;
    type: string;
    props: IBaseProps;
}

export type VirtualNode =
    | VNode
    | string

export interface IBaseObject {
    [name: string]: any;
}

export interface IBaseProps extends IBaseObject {
    children?: VirtualNode[];
    ref?: Ref;
    key?: string | number | undefined;
    className?: string;
}

export type Ref = string | ((node: RefElement) => void) | IObjectRef;

export interface ComponentLifecycle<P extends IBaseProps, S extends IBaseObject> {
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
        nextContext?: IBaseObject
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
        nextContext?: IBaseObject
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
        prevContext?: IBaseObject
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

export interface ComponentMinx<P extends IBaseProps, S extends IBaseObject> extends ComponentLifecycle<P, S> {
    getChildContext?(): IBaseObject;
    isReactComponent(): boolean;
    isMounted(): boolean;
    replaceState(): void;
    setState(state: S | ((s: S) => S | void), cb: () => void): void | S;
    forceUpdate(cb: () => void): void;
    render(): VNode | null | undefined;
}
