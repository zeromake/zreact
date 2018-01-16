import { createElement, createElement as h } from "./create-element";
import { cloneElement } from "./clone-element";
import { Component } from "./component";
import { PureComponent } from "./pure-component";
import { render } from "./render";
import options from "./options";
import { createClass } from "./create-class";
import { rerender } from "./render-queue";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";
import { VNode } from "./vnode";
import {
    findDOMNode,
    findVDom,
} from "./find";
import Children from "./children";
import { unmountComponent } from "./vdom/component";

declare const VERSION_ENV: string;
const version = VERSION_ENV;

/**
 * 判断是否为一个组件对象
 * @param element
 */
function isValidElement(element: VNode| any): boolean {
    return element && (element instanceof VNode);
}

function unmountComponentAtNode(dom: any) {
    const vdom = findVDom(dom);
    if (vdom) {
        unmountComponent(vdom.component as any);
        return true;
    }
    return false;
  }

function createFactory(type: any) {
    return createElement.bind(null, type);
}

class WrapperComponent<P, S> extends Component<P, S> {
    public getChildContext() {
        return (this.props as any).context;
    }
    public render() {
        return Children.only((this.props as any).children);
    }
}
function unstable_renderSubtreeIntoContainer(
    parentComponent: any,
    vnode: any,
    container: any,
    callback: any,
  ) {
    // @TODO: should handle props.context?
    const wrapper = createElement(
        WrapperComponent,
        { context: parentComponent.context},
        cloneElement(vnode, {ref: (component: WrapperComponent<any, any>) => callback.call(component, component)}),
    );
    const rendered = render(wrapper as any, container);
    // if (callback) {
    //     callback.call(rendered);
    // }
    return rendered;
}

function createPortal(vnode: any, container: HTMLElement) {
    // mountVNode can handle array of vnodes for us
    const first = container.firstElementChild;
    render(vnode, container, first as any);
    return null;
}

export default {
    Children,
    Component,
    PureComponent,
    createElement,
    cloneElement,
    createClass,
    createFactory,
    createPortal,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    unmountComponentAtNode,
    unstable_renderSubtreeIntoContainer,
    version,
};

export {
    Component,
    Children,
    PureComponent,
    cloneElement,
    createClass,
    createElement,
    createFactory,
    createPortal,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    unmountComponentAtNode,
    unstable_renderSubtreeIntoContainer,
    version,
};
