import { h, h as createElement } from "./h";
import { cloneElement } from "./clone-element";
import { Component } from "./component";
// import { PureComponent } from "./pure-component";
import { render } from "./render";
import options from "./options";
import { createClass } from "./create-class";
import { rerender } from "./render-queue";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";
import { VNode } from "./vnode";
import { findDOMNode, findVDom } from "./find";

declare const VERSION_ENV: string;
const version = VERSION_ENV;

/**
 * 判断是否为一个组件对象
 * @param element 
 */
function isValidElement(element: VNode| any): boolean {
    return element && (element instanceof VNode);
}

export default {
    Component,
    // PureComponent,
    cloneElement,
    createClass,
    createElement,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    version,
};

export {
    Component,
    // PureComponent,
    cloneElement,
    createClass,
    createElement,
    findDOMNode,
    findVDom,
    isValidElement,
    h,
    options,
    render,
    rerender,
    version,
};
