import { FORCE_RENDER } from "./constants";
import { renderComponent } from "./vdom/component";
import { VNode } from "./vnode";
import { enqueueRender } from "./render-queue";
import { extend } from "./util";

export class Component {
    // 当前组件的状态,可以修改
    public state: any;
    // 由父级组件传递的状态，不可修改
    public props: any;
    public context: any;
    public defaultProps?: any;
    // 组件挂载后的dom
    public base?: Element;
    public name?: string;
    public prevProps?: any;
    public prevState?: any;
    public prevContext?: any;
    public nextBase?: Element;
    /**
     * 在一个组件被渲染到 DOM 之前
     */
    public componentWillMount?: () => void;
    /**
     * 在一个组件被渲染到 DOM 之后
     */
    public componentDidMount?: () => void;
    /**
     * 在一个组件在 DOM 中被清除之前
     */
    public componentWillUnmount?: () => void;
    /**
     * 在新的 props 被接受之前
     * @param { any } nextProps
     * @param { any } nextContext
     */
    public componentWillReceiveProps?: (nextProps: any, nextContext: any) => void;
    /**
     * 在 render() 之前. 若返回 false，则跳过 render，与 componentWillUpdate 互斥
     * @param { any } nextProps
     * @param { any } nextState
     * @param { any } nextContext
     * @returns { boolean }
     */
    public shouldComponentUpdate?: (nextProps: any, nextState: any, nextContext: any) => boolean;
    /**
     * 在 render() 之前，与 shouldComponentUpdate 互斥
     * @param { any } nextProps
     * @param { any } nextState
     * @param { any } nextContext
     */
    public componentWillUpdate?: (nextProps: any, nextState: any, nextContext: any) => void;
    /**
     * 在 render() 之后
     * @param { any } previousProps
     * @param { any } previousState
     * @param { any } previousContext
     */
    public componentDidUpdate?: (previousProps: any, previousState: any, previousContext: any) => void;
    public getChildContext?: () => any;
    public _component?: Component;
    public _parentComponent?: Component;
    // 能否添加入更新队列
    public _dirty: boolean;
    // render 执行完后的回调队列
    public _renderCallbacks?: any[];
    public _key?: string;
    // 是否停用
    public _disable?: boolean;
    public _ref?: (component: Component | null) => void;
    constructor(props: any, context: any) {
        // 初始化为true
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = {};
    }
    /**
     * 设置state并通过enqueueRender异步更新dom
     * @param state 对象或方法
     * @param callback render执行完后的回调。
     */
    public setState(state: any, callback?: () => void): void {
        const s: any = this.state;
        if (!this.prevState) {
            // 把旧的状态保存起来
            this.prevState = { ...s };
        }
        if (typeof state === "function") {
            const newState = state(s, this.props);
            if (newState) {
                extend(s, newState);
            }
        } else {
            extend(s, state);
        }
        if (callback) {
            // 添加回调
            this._renderCallbacks = this._renderCallbacks || [];
            this._renderCallbacks.push(callback);
        }
        // 更新dom
        enqueueRender(this);
    }
    /**
     * 手动的同步更新dom
     * @param callback 回调
     */
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
