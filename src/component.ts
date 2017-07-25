import { FORCE_RENDER } from "./constants";
import { renderComponent } from "./vdom/component";
import { VNode } from "./vnode";
import { enqueueRender } from "./render-queue";
import { extend } from "./util";
import { IKeyValue } from "./types";

export class Component {
    /**
     * 默认props
     */
    public static defaultProps?: IKeyValue;
    /**
     * 当前组件的状态,可以修改
     */
    public state: IKeyValue;
    /**
     * 由父级组件传递的状态，不可修改
     */
    public props: IKeyValue;
    /**
     * 组件上下文，由父组件传递
     */
    public context: IKeyValue;
    /**
     * 组件挂载后的dom
     */
    public base?: Element;
    /**
     * 自定义组件名
     */
    public name?: string;
    /**
     * 上一次的属性
     */
    public prevProps?: IKeyValue;
    /**
     * 上一次的状态
     */
    public prevState?: IKeyValue;
    /**
     * 上一次的上下文
     */
    public prevContext?: IKeyValue;
    /**
     * 被移除时的dom缓存
     */
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
     * @param { IKeyValue } nextProps
     * @param { IKeyValue } nextContext
     */
    public componentWillReceiveProps?: (nextProps: IKeyValue, nextContext: IKeyValue) => void;
    /**
     * 在 render() 之前. 若返回 false，则跳过 render，与 componentWillUpdate 互斥
     * @param { IKeyValue } nextProps
     * @param { IKeyValue } nextState
     * @param { IKeyValue } nextContext
     * @returns { boolean }
     */
    public shouldComponentUpdate?: (nextProps: IKeyValue, nextState: IKeyValue, nextContext: IKeyValue) => boolean;
    /**
     * 在 render() 之前，与 shouldComponentUpdate 互斥
     * @param { IKeyValue } nextProps
     * @param { IKeyValue } nextState
     * @param { IKeyValue } nextContext
     */
    public componentWillUpdate?: (nextProps: IKeyValue, nextState: IKeyValue, nextContext: IKeyValue) => void;
    /**
     * 在 render() 之后
     * @param { IKeyValue } previousProps
     * @param { IKeyValue } previousState
     * @param { IKeyValue } previousContext
     */
    public componentDidUpdate?: (previousProps: IKeyValue, previousState: IKeyValue, previousContext: IKeyValue) => void;
    /**
     * 获取上下文，会被传递到所有的子组件
     */
    public getChildContext?: () => IKeyValue;
    /**
     * 子组件
     */
    public _component?: Component;
    /**
     * 父组件
     */
    public _parentComponent?: Component;
    /**
     * 是否加入更新队列
     */
    public _dirty: boolean;
    /**
     * render 执行完后的回调队列
     */
    public _renderCallbacks?: any[];
    /**
     * 当前组件的key用于复用
     */
    public _key?: string;
    /**
     * 是否停用
     */
    public _disable?: boolean;
    /**
     * react标准用于设置component实例
     */
    public _ref?: (component: Component | null) => void;
    /**
     * VDom暂定用于存放组件根dom的上下文
     */
    public child?: any;
    constructor(props: IKeyValue, context: IKeyValue) {
        // 初始化为true
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
    }
    /**
     * 设置state并通过enqueueRender异步更新dom
     * @param state 对象或方法
     * @param callback render执行完后的回调。
     */
    public setState(state: IKeyValue, callback?: () => void): void {
        const s: IKeyValue = this.state;
        if (!this.prevState) {
            // 把旧的状态保存起来
            this.prevState = extend({}, s);
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
        // 重新执行render
        renderComponent(this, FORCE_RENDER);
    }
    /**
     * 用来生成VNode的函数，一定要继承后覆盖
     * @param props
     * @param state
     * @param context
     */
    public render(props?: IKeyValue, state?: IKeyValue, context?: IKeyValue): VNode | void {
        // console.error("not set render");
    }
}
