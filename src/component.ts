import { FORCE_RENDER } from "./constants";
import { renderComponent } from "./vdom/component";
import { IVNode } from "./vnode";
import { enqueueRender } from "./render-queue";
import { extend } from "./util";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";
import { h } from "./h";

export class Component <PropsType extends IKeyValue, StateType extends IKeyValue> {
    /**
     * 默认props
     */
    public static defaultProps?: IKeyValue;
    /**
     * 当前组件的状态,可以修改
     */
    public state: StateType;
    /**
     * 由父级组件传递的状态，不可修改
     */
    public props: PropsType;
    /**
     * 组件上下文，由父组件传递
     */
    public context: IKeyValue;
    /**
     * 组件挂载后的vdom
     */
    public vdom?: IVDom;
    /**
     * 被移除时的vdom缓存
     */
    public nextVDom?: IVDom;
    /**
     * 自定义组件名
     */
    public name?: string;
    /**
     * 上一次的属性
     */
    public prevProps?: PropsType;
    /**
     * 上一次的状态
     */
    public prevState?: StateType;
    /**
     * 上一次的上下文
     */
    public prevContext?: IKeyValue;
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
     * @param { PropsType } nextProps
     * @param { IKeyValue } nextContext
     */
    public componentWillReceiveProps?: (nextProps: PropsType, nextContext: IKeyValue) => void;
    /**
     * 在 render() 之前. 若返回 false，则跳过 render，与 componentWillUpdate 互斥
     * @param { PropsType } nextProps
     * @param { StateType } nextState
     * @param { IKeyValue } nextContext
     * @returns { boolean }
     */
    public shouldComponentUpdate?: (nextProps: PropsType, nextState: StateType, nextContext: IKeyValue) => boolean;
    /**
     * 在 render() 之前，与 shouldComponentUpdate 互斥
     * @param { PropsType } nextProps
     * @param { StateType } nextState
     * @param { IKeyValue } nextContext
     */
    public componentWillUpdate?: (nextProps: PropsType, nextState: StateType, nextContext: IKeyValue) => void;
    /**
     * 在 render() 之后
     * @param { PropsType } previousProps
     * @param { StateType } previousState
     * @param { IKeyValue } previousContext
     */
    public componentDidUpdate?: (previousProps: PropsType, previousState: StateType, previousContext: IKeyValue) => void;
    /**
     * 获取上下文，会被传递到所有的子组件
     */
    public getChildContext?: () => IKeyValue;

    public h: typeof h;
    /**
     * 子组件
     */
    public _component?: Component<IKeyValue, IKeyValue>;
    /**
     * 父组件
     */
    public _parentComponent?: Component<IKeyValue, IKeyValue>;
    /**
     * 是否加入更新队列
     */
    public _dirty: boolean;
    /**
     * render 执行完后的回调队列
     */
    public _renderCallbacks?: Array<() => void>;
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
    public _ref?: (component: Component<PropsType, StateType> | null) => void;
    constructor(props: PropsType, context: IKeyValue) {
        // 初始化为true
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
        this.h = h;
    }
    /**
     * 设置state并通过enqueueRender异步更新dom
     * @param state 对象或方法
     * @param callback render执行完后的回调。
     */
    public setState(state: StateType, callback?: () => void): void {
        const s: StateType = this.state;
        if (!this.prevState) {
            // 把旧的状态保存起来
            this.prevState = extend({}, s);
        }
        // 把新的state和并到this.state
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
        // 异步队列更新dom，通过enqueueRender方法可以保证在一个任务栈下多次setState但是只会发生一次render
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
    public render(props?: PropsType, state?: StateType, context?: IKeyValue): IVNode | void {
        // console.error("not set render");
    }
}
