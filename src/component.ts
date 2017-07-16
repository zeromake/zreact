import { FORCE_RENDER } from "./constants";
import { renderComponent } from "./vdom/component";
import { VNode } from "./vnode";

export class Component {
    public state: any;
    public props: any;
    public context: any;
    public defaultProps?: any;
    public base?: Element;
    public name?: string;
    public prevProps?: any;
    public prevState?: any;
    public prevContext?: any;
    public nextBase?: Element;
    public componentWillMount?: () => void;
    public componentDidMount?: () => void;
    public componentWillUnmount?: () => void;
    public componentWillReceiveProps?: (nextProps: any, nextContext: any) => void;
    public shouldComponentUpdate?: (nextProps: any, nextState: any, nextContext: any) => boolean;
    public componentWillUpdate?: (nextProps: any, nextState: any, nextContext: any) => void;
    public componentDidUpdate?: (previousProps: any, previousState: any, previousContext: any) => void;
    public getChildContext?: () => any;
    public _component?: Component;
    public _parentComponent?: Component;
    public _dirty: boolean;
    public _renderCallbacks?: any[];
    public _key?: string;
    public _disable?: boolean;
    public _ref?: (component: Component | null) => void;
    constructor(props: any, context: any) {
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
    }
    public setState( state: any, callback?: () => void): void {
        let s: any = this.state;
        if (!this.prevState) {
            this.prevState = { ...s };
        }
        s = {...(typeof state === "function" ? state(s, this.props) : state)};
        if (callback) {
            this._renderCallbacks = this._renderCallbacks || [];
            this._renderCallbacks.push(callback);
        }
        // enqueueRender(this);
    }
    public forceUpdate(callback: () => void) {
        if (callback) {
            this._renderCallbacks = this._renderCallbacks || [];
            this._renderCallbacks.push(callback);
        }
        renderComponent(this, FORCE_RENDER);
    }
    public render(state: any, props: any, context?: any): VNode {
        throw new TypeError("not set render");
    }
}
