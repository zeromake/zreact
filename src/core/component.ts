import {
    IBaseObject,
    returnFalse,
    returnTrue,
} from "./util";

export interface IBaseProps extends IBaseObject {
    ref?: (vnode: Component<any, any> | Element) => void;
    key?: string;
}

export interface IUpdater {
    enqueuSetState(
        component: Component<any, any>,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb: () => void,
    ): boolean;
    isMounted(component: Component<any, any>): boolean;
}

export const fakeUpdater: IUpdater = {
    enqueuSetState: returnFalse,
    isMounted: returnFalse,
};

export class Component<P extends IBaseProps, S extends IBaseObject> {
    public static defaultProps?: IBaseObject;
    /**
     * componentWillReceiveProps react16.3后的替代品
     * @param nextProps
     * @param preState
     */
    public static getDerivedStateFromProps?(nextProps: IBaseProps, preState: IBaseObject): IBaseObject | null | undefined;
    public context: IBaseObject;
    public state: S | null;
    public props: P;
    public updater: IUpdater;

    constructor(props: P, context: IBaseObject) {
        this.context = context;
        this.props = props;
        this.updater = fakeUpdater;
        this.state = null;
    }

    /* ----------------life method start---------------- */
    /**
     * 初始化组件渲染到 dom 前
     * @deprecated
     */
    public componentWillMount?(): void;

    /**
     * 初始化组件渲染之后
     */
    public componentDidMount?(): void;

    /**
     * 在新的 props 合并前, setState不会触发
     * @param nextProps 新的 props
     * @param nextContext 新的 context
     * @deprecated
     */
    public componentWillReceiveProps?(nextProps: P, nextContext: IBaseObject): void;

    /**
     * 在新一轮 render 之前，所有的更新操作都会触发。
     * @param nextProps 新的 props
     * @param nextState 新的 state
     * @param nextContext 新的 context
     */
    public componentWillUpdate?(nextProps: P, nextState: S, nextContext: IBaseObject): void;

    /**
     * 在一次 render 完成后
     * @param preProps 上次 props
     * @param preState 上次 state
     * @param snapshot 新api
     * @param preContext 上次 context
     */
    public componentDidUpdate?(preProps: P, preState: S, snapshot: any, preContext: IBaseObject): void;

    /**
     * 在 render() 之前. 若返回 false，则跳过 render
     * @param nextProps
     * @param nextState
     * @param nextContext
     */
    public shouldComponentUpdate?(nextProps: P, nextState: S, nextContext: IBaseObject): boolean;

    /* ----------------life method end---------------- */

    /**
     * 获取 context 会被传递到所有的子组件
     */
    public getChildContext?(): IBaseObject;

    public isReactComponent(): boolean {
        return true;
    }

    public isMounted(): boolean {
        return this.updater.isMounted(this);
    }
    public replaceState(): void {

    }

    public setState(state: S | ((s: S) => S|null|undefined), cb: () => void): void {
        this.updater.enqueuSetState(this, state, cb);
    }

    public forceUpdate(cb: () => void): void {
        this.updater.enqueuSetState(this, true, cb);
    }

    public render(): any | null | undefined | boolean {
        throw TypeError("must implement render");
    }
}
