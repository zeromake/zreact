import { Children } from "zreact-core/children";
import { PropTypes } from "zreact-core/prop-type";
import { Component } from "zreact-core/component";
import { PureComponent } from "zreact-core/pure-component";
import { createRef, forwardRef } from "zreact-core/create-ref";
import { createPortal } from "zreact-core/create-portal";
import { createContext } from "zreact-core/create-context";
import {
    createElement,
    cloneElement,
    isValidElement,
    createFactory,
} from "zreact-core/create-element";
import { Fragment } from "zreact-core/util";

import { findDOMNode } from "zreact-render/dom/find-dom-node";
import { DOMRenderer } from "zreact-render/dom/dom-renderer";
import { options } from "zreact-fiber/options";
import {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useContext,
    useRef,
    useMeno,
    useImperativeMethods,
} from "zreact-core/hook";
const {
    render,
    eventSystem,
    unstable_renderSubtreeIntoContainer,
    unmountComponentAtNode,
    batchedUpdates,
} = DOMRenderer;

const version = "16.6.0";
const hydrate = render;

export {
    options,
    eventSystem,
    findDOMNode,
    unmountComponentAtNode,
    unstable_renderSubtreeIntoContainer,
    version,
    render,
    hydrate,
    batchedUpdates as unstable_batchedUpdates,
    Fragment,
    PropTypes,
    Children,
    createPortal,
    createContext,
    Component,
    createRef,
    forwardRef,
    createElement,
    cloneElement,
    PureComponent,
    isValidElement,
    createFactory,
    useState,
    useEffect,
    useReducer,
    useCallback,
    useContext,
    useRef,
    useMeno,
    useImperativeMethods,
};
