import options from "../options";
import { enqueueRender } from "../render-queue";
import { Component } from "../component";
import { VNode } from "../vnode";
import { createComponent, collectComponent } from "./component-recycler";
import { getNodeProps } from "./index";
import { removeNode } from "../dom/index";
import { extend } from "../util";
import { IKeyValue } from "../types";
import {
    ASYNC_RENDER,
    ATTR_KEY,
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

/**
 * 设置props，通常来自jsx
 * @param component 组件
 * @param props 新的props
 * @param opts render的执行方式
 * @param context 新的context
 * @param mountAll 是否已挂载
 */
export function setComponentProps(component: Component, props: IKeyValue, opts: number, context: IKeyValue, mountAll: boolean) {
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
    if (!component.base || mountAll) {
        // 如果没有插入到DOM树或正在被render渲染执行钩子
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    } else if (component.componentWillReceiveProps) {
        // 更新的钩子
        component.componentWillReceiveProps(props, context);
    }
    if (context && context !== component.context) {
        // 保存旧的context，设置新的context
        if (!component.prevContext) {
            component.prevContext = component.context;
        }
        component.context = context;
    }
    // 同上
    if (!component.prevProps) {
        component.prevProps = component.props;
    }
    component.props = props;
    // 进入renderComponent前启用组件
    component._disable = false;
    if (opts !== NO_RENDER) {
        // 进行renderComponent
        if (
            opts === SYNC_RENDER
            || options.syncComponentUpdates !== false
            || !component.base
        ) {
            // 同步执行
            renderComponent(component, SYNC_RENDER, mountAll);
        } else {
            // 异步执行
            enqueueRender(component);
        }
    }
    // 用于react的标准ref用于dom实例化完成后组件引用，多用于函数组件。
    if (component._ref) {
        component._ref(component);
    }
}

/**
 * 执行render，diff或新建render
 * @param {Component} component
 * @param {number?} opts
 * @param {boolean?} mountALL
 * @param {boolean?} isChild
 */
export function renderComponent(component: Component, opts?: number, mountALL?: boolean, isChild?: boolean): void {
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
    const previousProps = component.prevProps || props;
    // 获取组件上一次的state没有取当前
    const previousState = component.prevState || state;
    // 获取组件上一次的context没有取当前
    const previousContext = component.prevContext || context;
    // 判断是否已有dom元素
    const isUpdate = component.base;
    // 上次移除的dom
    const nextBase = component.nextBase;
    // 组件dom
    const initialBase = isUpdate || nextBase;
    // 获取当前组件的子组件
    const initialChildComponent = component._component;
    // 略过dom更新标记
    let skip = false;
    let cbase: Element | undefined;
    if (isUpdate) {
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
            // render 前钩子与shouldComponentUpdate互斥, Component.forceUpdate更新依旧会触发该钩子。
            component.componentWillUpdate(props, state, context);
        }
        // 把组件上的props，state，context都设置到新的
        component.props = props;
        component.state = state;
        component.context = context;
    }
    // 清理掉
    component.prevProps = undefined;
    component.prevState = undefined;
    component.prevContext = undefined;
    component.nextBase = undefined;
    // 重置_dirty
    component._dirty = false;

    if (!skip) {
        // 当前组件的render函数返回的VNode
        const rendered: VNode | void = component.render(props, state, context);
        //
        let inst: Component | undefined;
        if (component.getChildContext) {
            context = extend(context, component.getChildContext());
        }
        // 取出VNode的nodeName
        const childComponent = rendered && rendered.nodeName;
        let toUnmount: Component | undefined;
        let base: Element | undefined;

        if (typeof childComponent === "function" && rendered) {
            // 如果是自定义组件

            // if (component.child) {
            //     component.child = undefined;
            // }
            // 获取VNode上的props
            const childProps = getNodeProps(rendered);
            inst = initialChildComponent;
            if (inst && inst.constructor === childComponent && childProps.key === inst._key) {
                // 子组件已存在且key未变化只改变props
                setComponentProps(inst, childProps, SYNC_RENDER, context, false);
            } else {
                if (inst) {
                    // 设置到toUnmount等待unmount
                    toUnmount = inst;
                    toUnmount.child = extend({}, toUnmount.child);
                    // 清理
                    removeDomChild(inst.child);
                }
                // 新建Component
                inst = createComponent(childComponent, childProps, context);
                // 子组件索引保证下次相同子组件不会重新创建
                component._component = inst;
                // 设置好缓存dom
                inst.nextBase = inst.nextBase || nextBase;
                // 设置父组件索引
                inst._parentComponent = component;
                // 设置domchild
                inst.child = component.child;
                // 设置props但是不进行render
                setComponentProps(inst, childProps, NO_RENDER, context, false);
                // 递归调用renderComponent保证子组件的子组件创建
                renderComponent(inst, SYNC_RENDER, mountALL, true);
            }
            // 把子组件dom设置到base
            base = inst.base;
        } else {
            // 原生组件
            // 获取原dom或缓存dom
            cbase = initialBase;
            // 把自定义子组件放到卸载，对应使用if分支控制自定义组件和原生组件
            toUnmount = initialChildComponent;
            if (toUnmount) {
                // 如果存在说明上次渲染时是一个自定义组件
                // 清理子组件索引
                component._component = undefined;
                // 清理dom索引
                cbase = undefined;
            }

            if (initialBase || opts === SYNC_RENDER) {
                // 组件dom，缓存dom，同步渲染
                if (component.child && component.child._component) {
                    // 清理component索引防止使用同一个component情况下却卸载了。
                    component.child._component = undefined;
                    //
                    // const b: any = cbase;
                    // b._component = undefined;
                }
                // 渲染原生组件
                base = diff(
                    // 原dom
                    cbase,
                    // VNode
                    rendered,
                    context,
                    // 父级或者该原生组件，原dom不存在说明必须触发生命周期
                    mountALL || !isUpdate,
                    // 把组件挂载到缓存dom的父级
                    initialBase && initialBase.parentNode,
                    // 以原生组件这里执行说明是自定义组件的第一个原生组件
                    true,
                    // dom上下文
                    component.child,
                );
            }
        }

        if (initialBase && base !== initialBase && inst !== initialChildComponent) {
            // 存在缓存dom，现dom和缓存dom不相同且新建过自定义子组件
            // 获取当前组件缓存dom的父级dom
            const baseParent = initialBase.parentNode;
            if (base && baseParent && base !== baseParent) {
                // 替换到新dom
                baseParent.replaceChild(base, initialBase);
                if (!toUnmount) {
                    // 没有
                    // const initBase: any = initialBase;
                    // 去除dom上的component索引
                    // initBase._component = null;
                    component.child.base = initialBase;
                    component.child._component = null;
                    recollectNodeTree(component.child, false);
                    component.child.base = base;
                }
            }
        }
        if (toUnmount) {
            // 卸载无用的自定义组件
            unmountComponent(toUnmount);
        }
        // 当前自定义组件的根dom
        component.base = base;
        if (base && !isChild) {
            // 创建了dom且不是子组件渲染
            let componentRef: Component | undefined = component;
            let t: Component | undefined = component;
            // 获取根自定义组件，有可能是一个子组件变化数据
            while ((t = t._parentComponent)) {
                componentRef = t;
                componentRef.base = base;
            }
            // 保证dom的上下文为根自定义组件
            component.child._component = componentRef;
            component.child._componentConstructor = componentRef.constructor;
        }
    }
    if (!isUpdate || mountALL) {
        // 新建dom的需要触发componentDidMount放入mounts等待生命周期触发
        mounts.unshift(component);
    } else if (!skip) {
        // 没有skip render的话触发component.componentDidUpdate，options.afterUpdate钩子
        if (component.componentDidUpdate) {
            component.componentDidUpdate(previousProps, previousState, previousContext);
        }
        if (options.afterUpdate) {
            options.afterUpdate(component);
        }
    }

    if (component._renderCallbacks != null) {
        // 触发所有回调
        while (component._renderCallbacks.length) {
            component._renderCallbacks.pop().call(component);
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
    dom: any,
    vnode: VNode,
    context: IKeyValue,
    mountALL: boolean,
    child: any,
): Element {
    // 获取根组件缓存
    let c = child && child._component;
    const originalComponent = c;
    let oldDom = dom;
    // 判断是否为同一个组件类
    const isDiectOwner = c && child._componentConstructor === vnode.nodeName;
    let isOwner = isDiectOwner;
    // 获取jsx上的属性
    const props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
        // 向上查找
        isOwner = c.constructor === vnode.nodeName;
    }

    if (c && isOwner && (!mountALL || c._component)) {
        // 获取到可复用的组件，重新设置props，复用状态下有dom所有为了流畅使用异步
        setComponentProps(c, props, ASYNC_RENDER, context, mountALL);
        dom = c.base;
    } else {
        // 不存在可以复用的组件
        if (originalComponent && !isDiectOwner) {
            // 存在旧组件卸载它
            unmountComponent(originalComponent);
            dom = oldDom = null;
        }
        // 通过缓存组件的方式创建组件实例
        c = createComponent(vnode.nodeName, props, context);
        if (dom && !c.nextBase) {
            // 上次这个标签为原生组件，把将要卸载的组件dom缓存
            c.nextBase = dom;
            oldDom = null;
        }
        // 留下旧的上下文等待卸载
        const oldChild = extend({}, child);
        if (child.base) {
            // 清空等待新的上下文
            removeDomChild(child);
        }
        // 保证dom上下文的索引
        c.child = child;
        // 设置props，并创建dom
        setComponentProps(
            c,
            props,
            SYNC_RENDER,
            context,
            mountALL,
        );
        // 获取dom
        dom = c.base;
        if (oldDom && dom !== oldDom) {
            // 需要卸载dom
            child._component = null;
            recollectNodeTree(oldChild, false);
        }
    }
    return dom;
}

/**
 * 卸载组件
 * @param component 组件
 */
export function unmountComponent(component: Component) {
    if (options.beforeUnmount) {
        // 触发全局钩子
        options.beforeUnmount(component);
    }
    const base = component.base;
    // 停用组件
    component._disable = true;
    if (component.componentWillUnmount) {
        // 钩子
        component.componentWillUnmount();
    }
    // 清理dom索引
    component.base = undefined;
    // 获取子组件
    const inner = component._component;
    const anyBase: any = base;
    if (inner) {

        unmountComponent(inner);
    } else if (anyBase && component.child) {
        if (component.child[ATTR_KEY] && component.child[ATTR_KEY].ref) {
            // 触发dom卸载时的ref事件解除dom索引
            component.child[ATTR_KEY].ref(null);
        }
        // 卸载组件dom前把它存到nextBase
        component.nextBase = anyBase;
        // 从dom上移除
        removeNode(anyBase);
        // 放入全局缓存对象保存
        collectComponent(component);
        // 清空上下文
        removeChildren(component.child);
    }
    if (component._ref) {
        // 解除外部对组件实例的索引
        component._ref(null);
    }
}

/**
 * 额外的dom上下文清空，preact没有这个，自己加的。
 * @param child
 */
export function removeDomChild(child: any) {
    child.base = null;
    child._component = null;
    child[ATTR_KEY] = null;
    child.event = null;
    child._listeners = null;
    child._componentConstructor = null;
    child.children = [];
}
