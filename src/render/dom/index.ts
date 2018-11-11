import { findDOMNode } from "./find-dom-node";
import { DOMRenderer } from "./dom-renderer";

const {
    render,
    eventSystem,
    unstable_renderSubtreeIntoContainer,
    unmountComponentAtNode,
    batchedUpdates,
} = DOMRenderer;

export {
    render,
    unmountComponentAtNode,
    findDOMNode,
    batchedUpdates as unstable_batchedUpdates,
    eventSystem,
    unstable_renderSubtreeIntoContainer,
};
