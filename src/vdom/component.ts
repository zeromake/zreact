import { Component } from "../component";
import { ASYNC_RENDER, ATTR_KEY, FORCE_RENDER, NO_RENDER, SYNC_RENDER } from "../constants";
import { VNode } from "../vnode";
import { getNodeProps } from "./index";

export function setComponentProps(component: Component, props, opts, context, mountAll) {
    if (component._disable) {
        return;
    }
    component._disable = true;
    const ref = component.__ref = props.ref;
    if (ref) {
        delete props.ref;
    }
    const key = component.__key = props.key;
    if (key) {
        delete props.key;
    }
    if (!component.base || mountAll) {
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    }
}

export function renderComponent(component: Component, opts: any, mountALL?: boolean, isChild?: boolean) {
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
    const initialChildComponent = component.component;
    let skip = false;
    let rendered: VNode;
    let inst: Component;
    let cbase: any;
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
    component.nextBase = null;
    component.dirty = false;

    if (!skip) {
        rendered = component.render(props, state, context);
        if (component.getChildContext) {
            context = { ...({ ...context }), ...component.getChildContext() };
        }
    }
    const childComponent = rendered && rendered.nodeName;
    let toUnmount: any;
    let base: any;

    if (typeof childComponent === "function") {
        const childProps = getNodeProps(rendered);
        inst = initialChildComponent;
        if (inst && inst.constructor === childComponent && childProps.key === inst.__key) {
            setComponentProps(inst, childProps, SYNC_RENDER, context, false);
        }
    }
}
