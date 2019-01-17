import { diffProps } from "./props";
import { document, NAMESPACE } from "./browser";
import {
    noop,
    emptyObject,
    topNodes,
    topFibers,
} from "zreact-core/util";
import { Renderer, createRenderer } from "zreact-core/create-renderer";
import { render, createContainer } from "zreact-fiber/schedule-work";
import { duplexAction, fireDuplex, IDuplexElement } from "./duplex";
import { IFiber } from "zreact-fiber/type-shared";
import { OwnerType, IBaseObject, IWorkContext, IVNode } from "zreact-core/type-shared";

const reuseTextNodes: Text[] = []; // 文本节点不能加属性，样式与事件，重用没有副作用
export function createElement(vnode: IFiber): Element|Text|Comment {
    let p = vnode.return;
    const { type, props, text } = vnode;
    let ns = vnode.ns;
    switch (type) {
        case "#text":
            // 只重复利用文本节点
            const node = reuseTextNodes.pop();
            if (node) {
                node.nodeValue = text as string;
                return node;
            }
            return document.createTextNode(text as string);
        case "#comment":
            return document.createComment(text as string);
        case "svg":
            ns = NAMESPACE.svg;
            break;
        case "math":
            ns = NAMESPACE.math;
            break;

        default:
            do {
                const s: Element|null =
                    p!.name === "Portal"
                        ? p!.props.parent
                        : p!.tag === 5
                            ? p!.stateNode
                            : null;
                if (s) {
                    ns = s.namespaceURI as string;
                    if (p!.type === "foreignObject" || ns === NAMESPACE.xhtml) {
                        ns = "";
                    }
                    break;
                }
            } while ((p = p!.return));
            break;
    }
    try {
        if (ns) {
            vnode.namespaceURI = ns;
            return document.createElementNS(ns, type as string);
        }
        // eslint-disable-next-line
    } catch (e1) {
        /*skip*/
    }
    let elem = document.createElement(type as string);
    const inputType = props && props.type as string; // IE6-8下立即设置type属性
    if (inputType && (elem as any).uniqueID) {
        try {
            elem = document.createElement(
                "<" + type + " type='" + inputType + "'/>",
            );
        } catch (e2) {
            /*skip*/
        }
    }
    return elem;
}

// 缓存的 dom 对象会挂载在这个 div 下
const hyperspace = document.createElement("div");

function emptyElement(node: Node): void {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

Renderer.middleware({
    begin: noop,
    end: fireDuplex,
});

export function removeElement(node?: IDuplexElement) {
    if (!node) {
        return;
    }
    const nodeType = node.nodeType;
    if (nodeType === 1 && node.$events) {
        node.$events = undefined;
    } else if (nodeType === 3 && reuseTextNodes.length < 100) {
        reuseTextNodes.push(node as any);
    }
    hyperspace.appendChild(node);
    hyperspace.removeChild(node);
}

function insertElement(fiber: IFiber) {
    const parent = fiber.parent as IDuplexElement;
    const dom = fiber.stateNode as IDuplexElement;

    try {
        const insertPoint = (fiber.forwardFiber
            ? fiber.forwardFiber.stateNode
            : null) as IDuplexElement|null;
        const after = insertPoint ? insertPoint.nextSibling : parent.firstChild;
        if (after === dom) {
            return;
        }
        if (after === null && dom === parent.lastChild) {
            return;
        }
        // 插入**元素节点**会引发焦点丢失，触发body focus事件
        Renderer.inserting = fiber.tag === 5 && document.activeElement as any;
        parent.insertBefore(dom, after);
        Renderer.inserting = undefined;
    } catch (e) {
        throw e;
    }
}

// 其他Renderer也要实现这些方法
(render as any).Render = Renderer;
function mergeContext(container: IWorkContext, context: IBaseObject) {
    container.contextStack[0] = Object.assign({}, context);
}
export let DOMRenderer = createRenderer({
    render,
    updateAttribute(fiber: IFiber) {
        const { props, lastProps, stateNode } = fiber;
        diffProps(stateNode as Element, lastProps || emptyObject, props, fiber);
    },
    updateContent(fiber: IFiber) {
        (fiber.stateNode as Text).nodeValue = fiber.text as string;
    },
    updateControlled: duplexAction,
    createElement,
    insertElement,
    emptyElement(fiber: IFiber) {
        emptyElement(fiber.stateNode as Element);
    },
    unstable_renderSubtreeIntoContainer(instance: OwnerType, vnode: IVNode, root: Element, callback?: () => void) {
        // 看root上面有没有根虚拟DOM，没有就创建
        const container = createContainer(root);
        // const context = container.contextStack[0];
        let fiber = instance.$reactInternalFiber;
        let backup: IFiber|undefined;
        do {
            const inst = fiber!.stateNode;
            if (inst && inst.getChildContext) {
                mergeContext(container as IWorkContext, inst.getChildContext());
                backup = undefined;
                break;
            } else {
                backup = fiber;
            }
        } while ((fiber = fiber!.return));

        if (backup && backup.contextStack) {
            mergeContext(container as IWorkContext, backup.contextStack[0]);
        }

        return Renderer.render!(vnode, root, callback);
    },

    // [Top API] ReactDOM.unmountComponentAtNode
    unmountComponentAtNode(root: Element) {
        const container = createContainer(root, true);
        const fiber = container && container.child;
        if (fiber) {
            Renderer.updateComponent!(
                fiber,
                {
                    child: null,
                },
                function _() {
                    removeTop(root);
                },
                true,
            );
            return true;
        }
        return false;
    },
    removeElement(fiber: IFiber) {
        const dom = fiber.stateNode as Element;
        if (dom) {
            removeElement(dom);
            delete fiber.stateNode;
            if ((dom as any).$reactInternalFiber) {
                removeTop(dom);
            }
        }
    },
});

function removeTop(dom: Element) {
    const j = topNodes.indexOf(dom);
    if (j !== -1) {
        topFibers.splice(j, 1);
        topNodes.splice(j, 1);
    }
    (dom as any).$reactInternalFiber = null;
}
