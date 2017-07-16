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

export function renderComponent(component: Component, opts?: number, mountALL?: boolean, isChild?: boolean) {
    if (component._disable) {
        return;
    }
    const props = component.props;
    const state = component.state;
    let context = component.context;
    const previousProps = component.prevProps || props;
    const previousState = component.prevState || state;
    const previousContext = component.prevContext || context;
    const isUpdate = component.base;
    const nextBase = component.nextBase;
    const initialBase = isUpdate || nextBase;
    const initialChildComponent = component._component;
    let skip = false;
    let rendered: VNode | undefined;
    let inst: Component | undefined;
    let cbase: Element | undefined;
    if (isUpdate) {
        component.props = previousProps;
        component.state = previousState;
        component.context = previousContext;
        if (opts !== FORCE_RENDER
            && component.shouldComponentUpdate
            && component.shouldComponentUpdate(props, state, context) === false
        ) {
            skip = true;
        } else if (component.componentWillUpdate) {
            component.componentWillUpdate(props, state, context);
        }
        component.props = props;
        component.state = state;
        component.context = context;
    }
    // clear
    component.prevProps = null;
    component.prevState = null;
    component.prevContext = null;
    component.nextBase = undefined;
    component._dirty = false;

    if (!skip) {
        rendered = component.render(props, state, context);
        if (component.getChildContext) {
            context = { ...({ ...context }), ...component.getChildContext() };
        }
        // 取出VNode的nodeName
        const childComponent = rendered && rendered.nodeName;
        let toUnmount: Component | undefined;
        let base: Element | undefined;

        if (typeof childComponent === "function" && rendered) {
            // 如果是自定义组件
            const childProps = getNodeProps(rendered);
            inst = initialChildComponent;
            if (inst && inst.constructor === childComponent && childProps.key === inst._key) {
                setComponentProps(inst, childProps, SYNC_RENDER, context, false);
            } else {
                toUnmount = inst;
                inst = createComponent(childComponent, childProps, context);
                inst.nextBase = inst.nextBase || nextBase;
                inst._parentComponent = component;
                setComponentProps(inst, childProps, NO_RENDER, context, false);
                renderComponent(inst, SYNC_RENDER, mountALL, true);
            }
            base = inst.base;
        } else {
            cbase = initialBase;
            toUnmount = initialChildComponent;
            if (toUnmount) {
                component._component = undefined;
                cbase = undefined;
            }

            if (initialBase || opts === SYNC_RENDER) {
                if (cbase) {
                    const b: any = cbase;
                    b._component = undefined;
                }
                base = diff(
                    cbase,
                    rendered,
                    context,
                    mountALL || !isUpdate,
                    initialBase && initialBase.parentNode,
                    true,
                );
            }
        }
        if (initialBase && base !== initialBase && inst !== initialChildComponent) {
            const baseParent = initialBase.parentNode;
        }
    }
}

export function buildComponentFromVNode(
    dom: any,
    vnode: VNode,
    context: any,
    mountALL: boolean,
) {
    let c = dom && dom._component;
    const originalComponent = c;
    let oldDom = dom;
    const isDiectOwner = c && dom._componentConstructor === vnode.nodeName;
    let isOwner = isDiectOwner;
    const props = getNodeProps(vnode);
    c = c._parentComponent;
    while (c && !isOwner && c) {
        isOwner = c.constructor === vnode.nodeName;
        c = c._parentComponent;
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
        setComponentProps(
            c,
            props,
            SYNC_RENDER,
            context,
            mountALL,
        );
        dom = c.base;
        if (oldDom && dom !== oldDom) {
            oldDom._component = null;
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
    } else if (base) {
        if (anyBase[ATTR_KEY] && anyBase[ATTR_KEY].ref) {
            anyBase[ATTR_KEY].ref(null);
        }
        component.nextBase = base;
        removeNode(anyBase);
        collectComponent(component);
        removeChildren(base);
    }
    if (component._ref) {
        component._ref(null);
    }
}
