import options from "../options";
import { Component, createComponent, collectComponent } from "../component";
import { VNode } from "../vnode";
// import {  } from "./component-recycler";
import { getNodeProps } from "./index";
import { removeNode, setRef } from "../dom/index";
import { extend, defer } from "../util";
import { IKeyValue, childType, IReactContext, IReactProvider, IBaseProps } from "../types";
import { IVDom } from "./index";
import { findVDom, setVDom } from "../find";
import {
    ASYNC_RENDER,
    // ATTR_KEY,
    FORCE_RENDER,
    NO_RENDER,
    SYNC_RENDER,
} from "../constants";
import {
    diff,
    diffLevel,
    flushMounts,
    mounts,
    recollectNodeTree,
    removeChildren,
} from "./diff";

const emptyObject = {};

/**
 * 设置props，通常来自jsx
 * @param component 组件
 * @param props 新的props
 * @param opts render的执行方式
 * @param context 新的context
 * @param mountAll 是否已挂载
 */
export function setComponentProps(component: Component<IKeyValue, IKeyValue>, props: IKeyValue, opts: number, context: IKeyValue, mountAll: boolean) {
    if (component._disable) {
        // 如果组件已停用就什么都不做
        return;
    }
    // 阻止在异步时再次进入
    component._disable = true;
    // 取出ref设置到组件上
    const ref = component._ref = props.ref;
    if (ref) {
        // 清理掉props中的ref
        delete props.ref;
    }
    // 同上
    const key = component._key = props.key;
    if (key) {
        // 清理掉props中的key
        delete props.key;
    }
    const vdom = findVDom(component);
    const getDerivedStateFromProps = component.constructor && (component.constructor as typeof Component).getDerivedStateFromProps;
    if (getDerivedStateFromProps) {
        const oldState = component._prevState || component.state;
        const newState = getDerivedStateFromProps(props, oldState);
        if (newState != null) {
            component.state = extend({}, oldState, newState);
        }
    }
    if (!vdom || mountAll) {
        // 如果没有插入到DOM树或正在被render渲染执行钩子
        if (component.componentWillMount) {
            // console.warn("componentWillMount is deprecated!");
            component.componentWillMount();
        }
    } else {
        if (!getDerivedStateFromProps && component.componentWillReceiveProps) {
            // 更新的钩子
            // console.warn("componentWillReceiveProps is deprecated!");
            component.componentWillReceiveProps(props, context);
        }
    }
    if (context && context !== component.context) {
        // 保存旧的context，设置新的context
        if (!component._prevContext) {
            component._prevContext = component.context;
        }
        component.context = context;
    }
    // 同上
    if (!component._prevProps) {
        component._prevProps = component.props;
    }
    component.props = props;
    // 进入renderComponent前启用组件
    component._disable = false;
    if (opts !== NO_RENDER) {
        // 进行renderComponent
        if (
            opts === SYNC_RENDER
            || options.syncComponentUpdates !== false
            || vdom
        ) {
            // 同步执行
            renderComponent(component, SYNC_RENDER, mountAll);
        } else {
            // 异步执行
            enqueueRender(component);
        }
    }
    // 用于react的标准ref用于dom实例化完成后组件引用，多用于函数组件。
    setRef(component._ref, component);
}

/**
 * 执行render，diff或新建render
 * @param {Component} component
 * @param {number?} opts
 * @param {boolean?} mountALL
 * @param {boolean?} isChild
 */
export function renderComponent(component: Component<any, any>, opts?: number, mountALL?: boolean, isChild?: boolean): void {
    if (component._disable) {
        // 组件已停用直接不做操作。
        return;
    }
    // 获取组件props
    const props = component.props;
    // 获取组件state
    const state = component.state;
    // 获取组件context
    let context = component.context;
    // 获取组件上一次的props没有取当前
    const previousProps = component._prevProps || props;
    // 获取组件上一次的state没有取当前
    const previousState = component._prevState || state;
    // 获取组件上一次的context没有取当前
    const previousContext = component._prevContext || context;
    // 判断是否已有vdom
    const isUpdate = findVDom(component);
    // 上次移除的vdom
    const nextVDom = component._nextVDom;
    // 组件vdom
    const initialVDom = isUpdate || nextVDom;
    // 获取当前组件的子组件
    const initialChildComponent = component._component;
    // 略过dom更新标记
    let skip = false;
    let cvdom: IVDom | undefined;
    let snapshot: any;

    if (isUpdate && !component.isFunctionComponent) {
        // 有dom元素在组件上说明是更新操作.
        // 把组件上的props，state，context都返回到更新前
        component.props = previousProps;
        component.state = previousState;
        component.context = previousContext;
        if (opts !== FORCE_RENDER
            && component.shouldComponentUpdate
            && component.shouldComponentUpdate(props, state, context) === false
        ) {
            // 非用户代码调用(Component.forceUpdate),就执行shouldComponentUpdate钩子
            // 也就是说如果使用Component.forceUpdate来更新render执行就无法被阻止
            // shouldComponentUpdate钩子把新的props,state,context作为参数传入
            // 如果shouldComponentUpdate钩子返回false，跳过下面的dom操作。
            skip = true;
        } else if (component.componentWillUpdate) {
            // render Component.forceUpdate更新依旧会触发该钩子。
            // console.warn("componentWillUpdate is deprecated!");
            component.componentWillUpdate(props, state, context);
        }
        // 把组件上的props，state，context都设置到新的
        component.props = props;
        component.state = state;
        component.context = context;
    }
    // 清理掉
    component._prevProps = undefined;
    component._prevState = undefined;
    component._prevContext = undefined;
    component._nextVDom = undefined;
    // 重置_dirty
    component._dirty = false;

    if (!skip) {
        let rendered: childType;
        // 当前组件的render函数返回的VNode
        rendered = component.render(props, state, context);
        // getSnapshotBeforeUpdate
        if (isUpdate && !mountALL && component.getSnapshotBeforeUpdate) {
            snapshot = component.getSnapshotBeforeUpdate(previousProps, previousProps, previousContext);
        }
        let inst: Component<IKeyValue, IKeyValue> | undefined;
        if (component.getChildContext) {
            context = extend({}, context, component.getChildContext());
        }
        // 取出VNode的nodeName
        const childComponent = rendered && typeof rendered === "object" && rendered.nodeName;
        let toUnmount: Component<IKeyValue, IKeyValue> | undefined;
        let vdom: IVDom | undefined;

        if (typeof childComponent === "function") {
            // 如果是自定义组件

            // if (component.child) {
            //     component.child = undefined;
            // }
            // 获取VNode上的props
            const childProps = getNodeProps(rendered as VNode);
            inst = initialChildComponent;
            if (inst && inst.constructor === childComponent && childProps.key === inst._key) {
                // 子组件已存在且key未变化只改变props
                setComponentProps(inst, childProps, SYNC_RENDER, context, false);
            } else {
                if (inst) {
                    // 设置到toUnmount等待unmount
                    toUnmount = inst;
                }
                // 新建Component
                inst = createComponent(childComponent, childProps, context, (rendered as VNode).component);
                // 子组件索引保证下次相同子组件不会重新创建
                component._component = inst;
                // 设置好缓存dom
                inst._nextVDom = inst._nextVDom || nextVDom;
                // 设置父组件索引
                inst._parentComponent = component;
                // 设置props但是不进行render
                setComponentProps(inst, childProps, NO_RENDER, context, false);
                // 递归调用renderComponent保证子组件的子组件创建
                renderComponent(inst, SYNC_RENDER, mountALL, true);
            }
            // 把子组件dom设置到base
            vdom = findVDom(inst);
        } else {
            // 原生组件
            // 获取原dom或缓存dom
            cvdom = initialVDom;
            // 把自定义子组件放到卸载，对应使用if分支控制自定义组件和原生组件
            toUnmount = initialChildComponent;
            if (toUnmount) {
                // 如果存在说明上次渲染时是一个自定义组件
                // 清理子组件索引
                component._component = undefined;
                // 清理vdom索引
                cvdom = undefined;
            }

            if (initialVDom || opts === SYNC_RENDER) {
                // 组件dom，缓存dom，同步渲染
                if (cvdom && cvdom.component) {
                    // 清理component索引防止使用同一个component情况下却卸载了。
                    cvdom.component = undefined;
                    //
                    // const b: any = cbase;
                    // b._component = undefined;
                }
                let parentNode = null;
                if (initialVDom) {
                    if (!initialVDom.base) {
                        parentNode = initialVDom.parent;
                    } else {
                        parentNode = initialVDom.base && initialVDom.base.parentNode;
                    }
                }
                // 渲染原生组件
                vdom = diff(
                    // 原dom
                    cvdom,
                    // VNode
                    rendered,
                    context,
                    // 父级或者该原生组件，原dom不存在说明必须触发生命周期
                    mountALL || !isUpdate,
                    // 把组件挂载到缓存dom的父级
                    parentNode,
                    // 以原生组件这里执行说明是自定义组件的第一个原生组件
                    true,
                );
            }
        }

        if (initialVDom && vdom !== initialVDom && inst !== initialChildComponent) {
            // 存在缓存dom，现dom和缓存dom不相同且新建过自定义子组件
            // 获取当前组件缓存dom的父级dom
            let baseParent = initialVDom.parent;
            if (initialVDom.base) {
                baseParent = initialVDom.base && initialVDom.base.parentNode;
            }
            if (vdom && vdom.base && baseParent && vdom.base !== baseParent) {
                if (vdom.base) {
                    // 替换到新dom
                    if (initialVDom.base) {
                        baseParent.replaceChild(vdom.base, initialVDom.base as Element);
                    } else {
                        baseParent.appendChild(vdom.base);
                    }
                    if (!toUnmount) {
                        // 没有
                        initialVDom.component = undefined;
                        recollectNodeTree(initialVDom, false);
                    }
                } else if (initialVDom.base) {
                    if (!toUnmount) {
                        // 没有
                        initialVDom.component = undefined;
                        recollectNodeTree(initialVDom, false);
                    }
                }
            }
        }
        if (toUnmount) {
            // 卸载无用的自定义组件
            unmountComponent(toUnmount);
        }
        // 当前自定义组件的根dom
        setVDom(component, (vdom as IVDom));
        component.base = (vdom as IVDom).base;
        if (vdom && !isChild) {
            // 创建了dom且不是子组件渲染
            let componentRef: Component<IKeyValue, IKeyValue> | undefined = component;
            let t: Component<IKeyValue, IKeyValue> | undefined = component;
            // 获取根自定义组件，有可能是一个子组件变化数据
            while ((t = t._parentComponent)) {
                componentRef = t;
                setVDom(componentRef, (vdom as IVDom));
                componentRef.base = (vdom as IVDom).base;
            }
            // const dom: any = vdom.base;
            // 保证dom的上下文为根自定义组件
            vdom.component = componentRef;
            vdom.componentConstructor = componentRef.constructor;
        }
    }
    if (!isUpdate || mountALL) {
        // 新建dom的需要触发componentDidMount放入mounts等待生命周期触发
        mounts.unshift(component);
    } else if (!skip) {
        // 没有skip render的话触发component.componentDidUpdate，options.afterUpdate钩子
        if (component.componentDidUpdate) {
            component.componentDidUpdate(previousProps, previousState, snapshot, previousContext);
        }
        if (options.afterUpdate) {
            options.afterUpdate(component);
        }
    }

    if (component._renderCallbacks != null) {
        let callback: (() => void) | undefined;
        // 触发所有回调
        while (callback = component._renderCallbacks.pop()) {
            callback.call(component);
        }
    }
    if (!diffLevel && !isChild) {
        // 根状态下触发生命周期
        flushMounts();
    }
}

/**
 * 创建Component实例，buildComponentFromVNode创建的一般为父级为原生，或没有
 * @param dom 原dom
 * @param vnode VNode实例
 * @param context 父组件来的上下文
 * @param mountALL 是否需要挂载om
 * @param child 父组件用来对dom元素的上下文
 */
export function buildComponentFromVNode(
    vdom: IVDom | undefined | null,
    vnode: VNode,
    context: IKeyValue,
    mountALL: boolean,
): IVDom {
    // 获取根组件缓存
    let c = vdom && vdom.component;
    const originalComponent = c;
    // 判断是否为同一个组件类
    const isDiectOwner = vdom && vdom.componentConstructor === vnode.nodeName;
    let isOwner = isDiectOwner;
    // 获取jsx上的属性
    const props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
        // 向上查找
        isOwner = c.constructor === vnode.nodeName;
    }
    const tempVDom = findVDom(c);
    if (tempVDom && isOwner && (!mountALL || (c as Component<any, any>)._component)) {
        // 获取到可复用的组件，重新设置props，复用状态下有dom所有为了流畅使用异步
        setComponentProps((c as Component<any, any>), props, ASYNC_RENDER, context, mountALL);
        vdom = findVDom(c);
    } else {
        let oldVDom = vdom;
        const childHandle = oldVDom && oldVDom.childHandle;
        // 不存在可以复用的组件
        if (originalComponent && !isDiectOwner) {
            // 存在旧组件卸载它
            unmountComponent(originalComponent);
            vdom = oldVDom = null;
        }
        // 通过缓存组件的方式创建组件实例
        c = createComponent(vnode.nodeName, props, context, vnode.component);
        if (vdom && !c._nextVDom) {
            // 上次这个标签为原生组件，把将要卸载的组件dom缓存
            c._nextVDom = vdom;
            oldVDom = null;
        }
        // 留下旧的上下文等待卸载
        // const oldChild = extend({}, child);
        // if (child.base) {
        //     // 清空等待新的上下文
        //     removeDomChild(child);
        // }
        // 设置props，并创建dom
        setComponentProps(
            c,
            props,
            SYNC_RENDER,
            context,
            mountALL,
        );
        // 获取vdom,实际上通过setComponentProps已经有了c.vdom,但是typescript无法识别,直接强制转换
        vdom = findVDom(c) as IVDom;
        if (vdom && childHandle) {
            childHandle.replaceChild(vdom);
        }
        if (oldVDom && vdom !== oldVDom) {
            // 需要卸载dom
            oldVDom.component = undefined;
            recollectNodeTree(oldVDom, false);
        }
    }
    return vdom as IVDom;
}

/**
 * 卸载组件
 * @param component 组件
 */
export function unmountComponent(component: Component<any, any>) {
    if (options.beforeUnmount) {
        // 触发全局钩子
        options.beforeUnmount(component);
    }
    const vdom = findVDom(component);
    // 停用组件
    component._disable = true;
    if (component.componentWillUnmount) {
        // 钩子
        component.componentWillUnmount();
    }
    // 清理dom索引
    setVDom(component, undefined);
    component.base = undefined;
    // 获取子组件
    const inner = component._component;
    if (inner) {
        unmountComponent(inner);
    } else if (vdom) {
        if (typeof vdom.props === "object") {
            // 触发dom卸载时的ref事件解除dom索引
            setRef(vdom.props.ref, null);
            // vdom.props.ref(null);
        }
        // 卸载组件dom前把它存到nextBase
        component._nextVDom = vdom;
        // 从dom上移除
        if (vdom.base) {
            removeNode(vdom.base);
        }
        // 放入全局缓存对象保存
        collectComponent(component);
        // 清空上下文
        removeChildren(vdom);
    }
    // 解除外部对组件实例的索引
    setRef(component._ref, null);
}
interface IAsyncJob {
    component: Component<IBaseProps, IKeyValue>;
    args: any[];
}

let items: IAsyncJob[] = [];

/**
 * 根据Component队列更新dom。
 * 可以setState后直接执行这个方法强制同步更新dom
 */
export function rerender() {
    let p: IAsyncJob | undefined;
    const list = items;
    items = [];
    while (p = list.pop()) {
        if (p.component._dirty) {
            // 防止多次render。
            renderComponent(p.component, ...p.args);
        }
    }
}

/**
 * 把Component放入队列中等待更新
 * @param component 组件
 */
export function enqueueRender(component: Component<any, any>, ...args: any[]) {
    if (!component._dirty) {
        // 防止多次render
        component._dirty = true;
        const len = items.push({component, args});
        if (len === 1) {
            // 在第一次时添加一个异步render，保证同步代码执行完只有一个异步render。
            const deferFun = options.debounceRendering || defer;
            deferFun(rerender);
        }
    }
}
