import { FORCE_RENDER } from "./constants";
import { renderComponent, enqueueRender } from "./vdom/component";
import { VNode } from "./vnode";
// import { enqueueRender } from "./render-queue";
import { extend } from "./util";
import { IKeyValue, IRefObject, ComponentContext, IBaseProps, childType } from "./types";
import { IVDom } from "./vdom/index";
// import { h } from "./h";
// import options from "./options";

enum ComponentChildType {
    COMPONENT = 0,
    DOM = 1,
}

interface IComponentChild {
    type: ComponentChildType;
    index: number;
}

/**
 * 自定义组件所需继承类
 */
export class Component <PropsType extends IBaseProps, StateType extends IKeyValue> {
    /**
     * 默认props
     */
    public static defaultProps?: IKeyValue;

    /**
     * componentWillReceiveProps react16.3后的替代品
     * @param nextProps 将要接受的props
     * @param previousState 当前state
     * @returns 用于更改当前state为空不更改.
     */
    public static getDerivedStateFromProps?(nextProps: IKeyValue, previousState: IKeyValue): IKeyValue | null;

    /**
     * 当前组件的状态,可以修改
     */
    public state: StateType;

    public isFunctionComponent?: boolean;

    /**
     * react render 16 多node支持
     */
    public _children?: IComponentChild[];

    /**
     * 被移除时的vdom缓存
     */
    public _nextVDom?: IVDom;

    /**
     * 上一次的属性
     */
    public _prevProps?: PropsType;

    /**
     * 上一次的状态
     */
    public _prevState?: StateType;

    /**
     * 上一次的上下文
     */
    public _prevContext?: IKeyValue;

    /**
     * 绑定了this的
     */
    // public _h?: typeof h;

    /**
     * 子组件
     */
    public _component?: Component<IBaseProps, IKeyValue>;

    /**
     * 父组件
     */
    public _parentComponent?: Component<IBaseProps, IKeyValue>;

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
     * 模拟vue.emit用的上下文保存
     */
    public _emitComponent?: Component<any, any>;

    /**
     * react标准用于设置component实例
     */
    public _ref?: ((component: ComponentContext | null) => void) | IRefObject;

    /**
     * 由父级组件传递的状态，不可修改
     */
    public props: PropsType;

    /**
     * 组件上下文，由父组件传递
     */
    public context: IKeyValue;

    /**
     * 自定义组件名
     */
    public name?: string;

    /**
     * 组件挂载后的vdom
     */
    public _vdom?: IVDom;

    /**
     *
     */
    public base?: Node | Element | Text | null;

    constructor(props: PropsType, context: IKeyValue) {
        // 初始化为true
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = {} as StateType;
        // const self: any = this;
        // this.state = self.state || {} as StateType;
        // if (options.eventBind) {
        //     const self = this;
        //     this.h = function _(){
        //         return h.apply(self, Array.prototype.slice.call(arguments, 0));
        //     } as typeof h;
        // }
    }
    /**
     * 在一个组件被渲染到 DOM 之前
     * 在react16.3弃用: https://github.com/reactjs/rfcs/pull/6
     * 原因是因为如果在dom渲染前进行异步的setState可能会造成，第一次的渲染效果不同
     * @deprecated
     */
    public componentWillMount?(): void;

    /**
     * 在一个组件被渲染到 DOM 之后
     */
    public componentDidMount?(): void;

    /**
     * 在一个组件在 DOM 中被清除之前
     */
    public componentWillUnmount?(): void;

    /**
     * 在新的 props 被接受之前
     * Use static getDerivedStateFromProps() instead
     * @param { PropsType } nextProps
     * @param { IKeyValue } nextContext
     * @deprecated
     */
    public componentWillReceiveProps?(nextProps: PropsType, nextContext: IKeyValue): void;

    /**
     * 在 render() 之前. 若返回 false，则跳过 render，与 componentWillUpdate 互斥
     * @param { PropsType } nextProps
     * @param { StateType } nextState
     * @param { IKeyValue } nextContext
     * @returns { boolean }
     */
    public shouldComponentUpdate?(nextProps: PropsType, nextState: StateType, nextContext: IKeyValue): boolean;

    /**
     * 在 render() 之前，与 shouldComponentUpdate 互斥
     * @param { PropsType } nextProps
     * @param { StateType } nextState
     * @param { IKeyValue } nextContext
     * @deprecated
     */
    public componentWillUpdate?(nextProps: PropsType, nextState: StateType, nextContext: IKeyValue): void;

    /**
     * 在 render() 之后
     * @param { PropsType } previousProps
     * @param { StateType } previousState
     * @param { IKeyValue } previousContext
     */
    public componentDidUpdate?(previousProps: PropsType, previousState: StateType, snapshot: any, previousContext: IKeyValue): void;

    /**
     * 获取上下文，会被传递到所有的子组件
     */
    public getChildContext?(): IKeyValue;

    /**
     *
     * @param previousProps
     * @param previousState
     * @param previousContext
     */
    public getSnapshotBeforeUpdate?(previousProps: PropsType, previousState: StateType, previousContext: IKeyValue): any;

    /**
     * 设置state并通过enqueueRender异步更新dom
     * @param state 对象或方法
     * @param callback render执行完后的回调。
     */
    public setState(state: ((s: StateType, p: PropsType) => StateType) | StateType, callback?: () => void): void {
        const s: StateType = this.state;
        if (!this._prevState) {
            // 把旧的状态保存起来
            this._prevState = extend({}, s);
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
    public forceUpdate(callback?: () => void) {
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
    public render(props: PropsType, state: StateType, context: IKeyValue): childType {
    }
}

// import { h } from "../h";

/**
 * 缓存卸载自定义组件对象列表
 */
const components: {
    [name: string]: Array<Component<IKeyValue, IKeyValue>>;
} = {};

/**
 * 缓存卸载后的自定义组件
 * @param component 卸载后的组件
 */
export function collectComponent(component: Component<IKeyValue, IKeyValue>) {
    const constructor: any = component.constructor;
    component._emitComponent = undefined;
    // 获取组件名
    const name = constructor.name;
    // 获取该组件名所属的列表
    let list = components[name];
    if (!list) {
        list = components[name] = [];
    }
    // 设置
    list.push(component);
}

/**
 * 复用已卸载的组件
 * @param Ctor 要创建的组件对象
 * @param props
 * @param context
 */
export function createComponent(
    Ctor: any,
    props: IKeyValue,
    context: IKeyValue,
    component: Component<IKeyValue, IKeyValue> | undefined | void | null,
): Component<IKeyValue, IKeyValue> {
    const list = components[Ctor.name];
    let inst: Component<IKeyValue, IKeyValue>;
    // 创建组件实例
    if (Ctor.prototype && Ctor.prototype.render) {
        // if (newContext) {
        inst = new Ctor(props, context);
        // Component.call(inst, props, context);
    } else {
        // 一个方法
        inst = new Component(props, context);
        // 设置到constructor上
        inst.constructor = Ctor;
        // render用doRender代替
        inst.render = doRender;
        inst.isFunctionComponent = true;
    }
    // 查找之前的卸载缓存
    if (list) {
        for (let i = list.length; i-- ; ) {
            const item = list[i];
            if (item.constructor === Ctor) {
                inst._nextVDom = item._nextVDom;
                list.splice(i, 1);
                break;
            }
        }
    }
    return inst;
}

/**
 * 代理render,去除state
 * @param props
 * @param state
 * @param context
 */
function doRender(this: typeof Component, props: IBaseProps, state: IKeyValue, context: IKeyValue) {
    return this.constructor(props, context);
}
