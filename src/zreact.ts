import { h, h as createElement } from "./h";
import { cloneElement } from "./clone-element";
import { Component } from "./component";
import { PureComponent } from "./pure-component";
import { render } from "./render";
import options from "./options";
import { createClass } from "./create-class";
import { rerender } from "./render-queue";
import { buildVDom } from "./vdom/index";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";
import { VNode } from "./vnode";

declare const VERSION_ENV: string;
const version = VERSION_ENV;
export default {
    Component,
    PureComponent,
    buildVDom,
    cloneElement,
    createClass,
    createElement,
    h,
    options,
    render,
    rerender,
    version,
};

export {
    Component,
    PureComponent,
    buildVDom,
    cloneElement,
    createClass,
    createElement,
    h,
    options,
    render,
    rerender,
    version,
};
