import { Children } from "./core/children";
import { PropTypes } from "./core/prop-type";
import { Component } from "./core/component";
import { PureComponent } from "./core/pure-component";
import { createRef, forwardRef } from "./core/create-ref";
import { createPortal } from "./core/create-portal";
// import { createContext } from "react-core/createContext";
import {
    createElement,
    cloneElement,
    isValidElement,
    createFactory,
} from "./core/create-element";
import { Fragment } from "./core/util";

import { findDOMNode } from "./render/dom/find-dom-node";
import { DOMRenderer } from "./render/dom/dom-renderer";
import { options } from "./fiber/options";
const {
    render,
    eventSystem,
    unstable_renderSubtreeIntoContainer,
    unmountComponentAtNode,
    batchedUpdates,
} = DOMRenderer;

const version = "VERSION";

export {
    options,
    eventSystem,
    findDOMNode,
    unmountComponentAtNode,
    unstable_renderSubtreeIntoContainer,
    version,
    render,
    render as hydrate,
    batchedUpdates as unstable_batchedUpdates,
    Fragment,
    PropTypes,
    Children,
    createPortal,
    // createContext,
    Component,
    createRef,
    forwardRef,
    createElement,
    cloneElement,
    PureComponent,
    isValidElement,
    createFactory,
};
