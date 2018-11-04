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
    VirtualNode,
} from "./type-shared";
import { IFiber } from "../fiber/type-shared";

export class Component<P extends IBaseProps, S extends IBaseObject> implements IComponentMinx<P, S> {
    public static defaultProps?: IBaseObject;
    /**
     * componentWillReceiveProps react16.3后的替代品
     * @param nextProps
     * @param preState
     */
    public static getDerivedStateFromProps?(nextProps: IBaseProps, preState: IBaseObject): IBaseObject | null | undefined;

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
        this.updater.enqueueSetState(this, state, cb);
    }

    public forceUpdate(cb: () => void): void {
        this.updater.enqueueSetState(this, true, cb);
    }

    public render(): VirtualNode[] | VirtualNode {
        throw TypeError("must implement render");
    }
}
Component.prototype.isReactComponent = returnTrue;