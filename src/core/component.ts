import {
    returnTrue,
    fakeUpdater,
} from "./util";

import {
    IBaseObject,
    IBaseProps,
    IComponentMinx,
    IUpdater,
    VirtualNode,
    ChildrenType,
} from "./type-shared";
import { IFiber } from "zreact-fiber/type-shared";

export class Component<P extends IBaseProps, S extends IBaseObject> implements IComponentMinx<P, S> {
    public static defaultProps?: IBaseObject;
    /**
     * componentWillReceiveProps react16.3后的替代品
     * @param nextProps
     * @param preState
     */
    public static getDerivedStateFromProps?<T extends IBaseProps, F extends IBaseObject>(nextProps: T, preState: F): F | null | undefined | void;

    public isPureComponent?: boolean;
    public updater: IUpdater;
    public props: P;
    public state: S;
    public context?: IBaseObject;
    public $reactInternalFiber?: IFiber;

    constructor(props: P, context?: IBaseObject) {
        this.context = context;
        this.props = props;
        this.updater = fakeUpdater;
        this.state = null as any;
    }

    public isReactComponent?(): boolean;

    public isMounted(): boolean {
        return this.updater.isMounted(this);
    }
    public replaceState(): void {

    }

    public setState(state: S | ((s: S) => S|void), cb?: () => void): void {
        this.updater.enqueueSetState(this.$reactInternalFiber!, state, cb);
    }

    public forceUpdate(cb: () => void): void {
        this.updater.enqueueSetState(this.$reactInternalFiber!, true, cb);
    }

    public render(): VirtualNode[] | VirtualNode | ChildrenType {
        throw TypeError("must implement render");
    }
}
Component.prototype.isReactComponent = returnTrue;
