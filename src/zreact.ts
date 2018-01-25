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
import { REACT_ELEMENT_TYPE } from "./util";
import {
    findDOMNode,
    findVDom,
    findVoidNode,
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

function createPortal(vnode: any, container: HTMLElement) {
    // mountVNode can handle array of vnodes for us
    const voidNodes = findVoidNode(container);
    const voidNode = voidNodes && voidNodes[0];
    const first = container.firstElementChild;
    render(vnode, container, (voidNode || first) as any);
    return null;
}

export default {
    Children,
    Component,
    PureComponent,
    createElement,
    cloneElement,
    createClass,
    createPortal,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    unmountComponentAtNode,
    version,
    Element: REACT_ELEMENT_TYPE,
};

export {
    Component,
    Children,
    PureComponent,
    cloneElement,
    createClass,
    createElement,
    createPortal,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    unmountComponentAtNode,
    version,
    REACT_ELEMENT_TYPE as Element,
};
