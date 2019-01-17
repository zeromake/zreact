import { findHostInstance } from "zreact-fiber/find-host-instance";

// [Top API] ReactDOM.findDOMNode
export function findDOMNode(fiber: any) {
    if (fiber == null) {
        return null;
    }
    if (fiber.nodeType === 1) {
        return fiber;
    }
    if (!fiber.render) {
        throw TypeError("findDOMNode:invalid type");
    }
    return findHostInstance(fiber);
}
