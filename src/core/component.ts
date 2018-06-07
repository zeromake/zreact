import {
    returnFalse,
    returnTrue,
    fakeUpdater,
} from "./util";

import {
    IBaseObject,
    IBaseProps,
    IComponentMinx,
    IUpdater,
    IVNode,
} from "./type-shared";

export class Component<P extends IBaseProps, S extends IBaseObject> implements IComponentMinx<P, S> {
    public static defaultProps?: IBaseObject;
    /**
     * componentWillReceiveProps react16.3后的替代品
     * @param nextProps
     * @param preState
     */
    public static getDerivedStateFromProps?(nextProps: IBaseProps, preState: IBaseObject): IBaseObject | null | undefined;
    public updater: IUpdater;
    public props: P;
    public state: S|null;
    public context: IBaseObject;

    constructor(props: P, context: IBaseObject) {
        this.context = context;
        this.props = props;
        this.updater = fakeUpdater;
        this.state = null;
    }

    public isReactComponent?(): boolean;

    public isMounted(): boolean {
        return this.updater.isMounted(this);
    }
    public replaceState(): void {

    }

    public setState(state: S | ((s: S) => S|void), cb: () => void): void {
        this.updater.enqueuSetState(this, state, cb);
    }

    public forceUpdate(cb: () => void): void {
        this.updater.enqueuSetState(this, true, cb);
    }

    public render(): IVNode | string | null | undefined {
        throw TypeError("must implement render");
    }
}
Component.prototype.isReactComponent = returnTrue;
