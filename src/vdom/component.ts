import { enqueueRender } from "../render-queue";
import { Component } from "../component";
import { ASYNC_RENDER, ATTR_KEY, FORCE_RENDER, NO_RENDER, SYNC_RENDER } from "../constants";
import options from "../options";
import { VNode } from "../vnode";
import { createComponent, collectComponent } from "./component-recycler";
import { getNodeProps } from "./index";
import { removeNode } from "../dom/index";

import { diff, diffLevel, flushMounts, mounts, recollectNodeTree, removeChildren } from "./diff";

export function setComponentProps(component: Component, props: any, opts: any, context: any, mountAll: boolean) {
    if (component._disable) {
        return;
    }
    component._disable = true;
    const ref = component._ref = props.ref;
    if (ref) {
        delete props.ref;
    }
    const key = component._key = props.key;
    if (key) {
        delete props.key;
    }
    if (!component.base || mountAll) {
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    } else if (component.componentWillReceiveProps) {
        component.componentWillReceiveProps(props, context);
    }
    if (context && context !== component.context) {
        if (!component.prevContext) {
            component.prevContext = component.context;
        }
        component.context = context;
    }

    if (!component.prevProps) {
        component.prevProps = component.props;
    }
    component.props = props;
    component._disable = false;
    if (opts !== NO_RENDER) {
        if (
            opts === SYNC_RENDER
            || options.syncComponentUpdates !== false
            || !component.base
        ) {
            renderComponent(component, SYNC_RENDER, mountAll);
        } else {
            enqueueRender(component);
        }
    }
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
    // 被移除过时保存的dom
    const nextBase = component.nextBase;
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
    component.prevProps = null;
    component.prevState = null;
    component.prevContext = null;
    component.nextBase = undefined;
    // 重置_dirty
    component._dirty = false;

    if (!skip) {
        // 当前组件的render函数返回的VNode
        const rendered: VNode | undefined = component.render(props, state, context);
        //
        let inst: Component | undefined;
        if (component.getChildContext) {
            context = { ...context, ...component.getChildContext() };
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
                    toUnmount.child = {...toUnmount.child};
                    // 防止共享子dom
                    inst.child.children = [];
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
                if (!component.child) {
                    component.child = {};
                }
                // 渲染原生组件
                base = diff(
                    // 原dom
                    cbase,
                    // VNode
                    rendered,
                    context,
                    // 父级组件需要挂载，或者dom不存在也需要挂载
                    mountALL || !isUpdate,
                    // 把组件挂载到缓存dom的父级
                    initialBase && initialBase.parentNode,
                    // 以原生组件这里执行说明是自定义组件的第一个原生组件
                    true,
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
                    component.child.base = null;
                }
            }
        }
        if (toUnmount) {
            unmountComponent(toUnmount);
        }

        component.base = base;
        if (base && !isChild) {
            let componentRef: Component | undefined = component;
            let t: Component | undefined = component;
            while ((t = t._parentComponent)) {
                componentRef = t;
                componentRef.base = base;
            }
            // const _base: any = base;
            // try {
            //     _base._component = componentRef;
            //     _base._componentConstructor = componentRef.constructor;
            // } catch (e) {}
            component.child._component = componentRef;
            component.child._componentConstructor = componentRef.constructor;
            // component.child.base = base;
        }
    }
    if (!isUpdate || mountALL) {
        mounts.unshift(component);
    } else if (!skip) {
        if (component.componentDidUpdate) {
            component.componentDidUpdate(previousProps, previousState, previousContext);
        }
        if (options.afterUpdate) {
            options.afterUpdate(component);
        }
    }

    if (component._renderCallbacks != null) {
        while (component._renderCallbacks.length) {
            component._renderCallbacks.pop().call(component);
        }
    }
    if (!diffLevel && !isChild) {
        flushMounts();
    }
}

export function buildComponentFromVNode(
    dom: any,
    vnode: VNode,
    context: any,
    mountALL: boolean,
    child: any,
) {
    let c = child && child._component;
    const originalComponent = c;
    let oldDom = dom;
    const isDiectOwner = c && child._componentConstructor === vnode.nodeName;
    let isOwner = isDiectOwner;
    const props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
        isOwner = c.constructor === vnode.nodeName;
    }

    if (c && isOwner && (!mountALL || c._component)) {
        setComponentProps(c, props, ASYNC_RENDER, context, mountALL);
        dom = c.base;
    } else {
        if (originalComponent && !isDiectOwner) {
            unmountComponent(originalComponent);
            dom = oldDom = null;
        }

        c = createComponent(vnode.nodeName, props, context);
        if (dom && !c.nextBase) {
            c.nextBase = dom;
            oldDom = null;
        }
        c.child = child;
        // child._component = c;
        setComponentProps(
            c,
            props,
            SYNC_RENDER,
            context,
            mountALL,
        );
        dom = c.base;
        if (oldDom && dom !== oldDom) {
            // oldDom._component = null;
            recollectNodeTree(oldDom, false);
        }
    }
    return dom;
}

export function unmountComponent(component: Component) {
    if (options.beforeUnmount) {
        options.beforeUnmount(component);
    }
    const base = component.base;
    component._disable = true;
    if (component.componentWillUnmount) {
        component.componentWillUnmount();
    }
    component.base = undefined;
    const inner = component._component;
    const anyBase: any = base;
    if (inner) {
        unmountComponent(inner);
    } else if (anyBase && component.child) {
        if (component.child[ATTR_KEY] && component.child[ATTR_KEY].ref) {
            component.child[ATTR_KEY].ref(null);
        }
        // 卸载组件dom前把它存到nextBase
        component.nextBase = anyBase;
        // 从dom上移除
        removeNode(anyBase);
        // 放入全局缓存对象保存
        collectComponent(component);
        removeChildren(component.child);
    }
    if (component._ref) {
        component._ref(null);
    }
}

export function removeDomChild(child: any) {
    child.base = null;
    child._component = null;
    child[ATTR_KEY] = null;
    child.event = null;
    child._listeners = null;
    child._componentConstructor = null;
}
