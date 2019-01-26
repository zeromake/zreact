import {
    render,
    isValidElement,
    createElement,
    eventSystem,
    findDOMNode,
} from "../index";

function getFiber(inst: any) {
    return inst._reactInternalFiber || inst.updater;
}
// 收集符合条件的元素节点
function findChildren(fiber: any, callback: any, ret: any) {
    for (const i in fiber.children) {
        const a = fiber.children[i];
        findAllInRenderedTreeImpl(a, callback, ret);
    }
}
function findAllInRenderedTreeImpl(target: any, callback: any, ret: any) {
    if (!target) {
        return;
    } else if (target.nodeType) {
        if (callback(target)) {
            ret.push(target);
        }
    } else if (target.render) {
        // 实例
        const fiber = getFiber(target);
        findChildren(fiber, callback, ret);
    } else if (target.tag + 0 === target.tag) {
        const instance = target.stateNode;
        if (callback(instance)) {
            ret.push(instance);
        }
        if (instance.render) {
            // 实例
            findChildren(getFiber(instance), callback, ret);
        } else if (target.tag === 5) {
            findChildren(target, callback, ret);
        }
    }
}

const ReactTestUtils = {
    renderIntoDocument(element: any, cb?: any): any {
        const div = document.createElement("div");
        return render(element, div, cb);
    },

    isElement(element: any) {
        return isValidElement(element);
    },

    isElementOfType(inst: any, convenienceConstructor: any) {
        return isValidElement(inst) && inst.type === convenienceConstructor;
    },

    isDOMComponent(inst: any) {
        return !!(inst && inst.nodeType === 1 && inst.tagName);
    },

    isDOMComponentElement(inst: any) {
        // 是否为元素节点
        return !!(inst && isValidElement(inst) && !!inst.tagName);
    },

    isCompositeComponent(inst: any) {
        // 是否为组件实例
        if (ReactTestUtils.isDOMComponent(inst)) {
            return false;
        }
        return inst != null && typeof inst.render === "function" && typeof inst.setState === "function";
    },

    isCompositeComponentWithType(inst: any, type: any) {
        if (!ReactTestUtils.isCompositeComponent(inst)) {
            return false;
        }

        return inst.constructor === type;
    },

    isCompositeComponentElement(inst: any) {
        if (!isValidElement(inst)) {
            return false;
        }

        const prototype = inst.constructor.prototype;
        return typeof prototype.render === "function" && typeof prototype.setState === "function";
    },

    isCompositeComponentElementWithType(inst: any, type: any) {
        if (!ReactTestUtils.isCompositeComponent(inst)) {
            return false;
        }
        const fiber = inst._reactInternalFiber || {};
        return fiber.type = type;
    },

    findAllInRenderedTree(inst: any, fn: any) {
        const ret: any[] = [];
        if (!inst) {
            return ret;
        }
        findAllInRenderedTreeImpl(inst, fn, ret);
        return ret;
    },

    /**
     * 相当于getElementsByClassName
     */
    scryRenderedDOMComponentsWithClass(root: any[], classNames: string[]|string) {

        return ReactTestUtils.findAllInRenderedTree(root, (inst: any) => {
            if (ReactTestUtils.isDOMComponent(inst)) {
                let className = inst.className;
                if (typeof className !== "string") {
                    // SVG, probably.
                    className = inst.getAttribute("class") || "";
                }
                const classList = className.split(/\s+/);
                if (!Array.isArray(classNames)) {
                    classNames = classNames.split(/\s+/);
                }
                return classNames.every((name) => {
                    return classList.indexOf(name) !== -1;
                });
            }
            return false;
        });
    },

    /**
     * 相当于getElementByClassName(注意最多返回一个)，不等于1个就抛错
     */
    findRenderedDOMComponentWithClass(root: any, className: string) {
        const all = ReactTestUtils.scryRenderedDOMComponentsWithClass(root, className);
        if (all.length !== 1) {
            throw new Error("Did not find exactly one match (found: " + all.length + ") " + "for class:" + className);
        }
        return all[0];
    },

    /**
     * 相当于getElementsByTag
     */
    scryRenderedDOMComponentsWithTag(root: any, tagName: string) {
        return ReactTestUtils.findAllInRenderedTree(root, (inst: any) => {
            return ReactTestUtils.isDOMComponent(inst) && inst.tagName.toUpperCase() === tagName.toUpperCase();
        });
    },

    /**
     * 相当于getElementByTag(注意最多返回一个)，不等于1个就抛错
     */
    findRenderedDOMComponentWithTag(root: any, tagName: string) {
        const all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);
        if (all.length !== 1) {
            throw new Error("Did not find exactly one match (found: " + all.length + ") " + "for tag:" + tagName);
        }
        return all[0];
    },

    /**
     * 找出所有符合指定子组件的实例
     */
    scryRenderedComponentsWithType(root: any, componentType: any) {
        return ReactTestUtils.findAllInRenderedTree(root, (inst: any) => {
            return ReactTestUtils.isCompositeComponentWithType(inst, componentType);
        });
    },

    /**
     * 与scryRenderedComponentsWithType用法相同，但只返回一个节点，如有零个或多个匹配的节点就报错
     */
    findRenderedComponentWithType(root: any, componentType: any) {
        const all = ReactTestUtils.scryRenderedComponentsWithType(root, componentType);
        if (all.length !== 1) {
            throw new Error("Did not find exactly one match (found: " + all.length + ") " + "for componentType:" + componentType);
        }
        return all[0];
    },
    mockComponent(module: any, mockTagName: string) {
        mockTagName = mockTagName || module.mockTagName || "div";

        module.prototype.render.mockImplementation(function _(this: any) {
            return createElement(mockTagName, null, this.props.children);
        });

        return this;
    },

    simulateNativeEventOnNode(topLevelType: string, node: Element, fakeNativeEvent: any) {
        fakeNativeEvent.target = node;
        fakeNativeEvent.simulated = true;
        if (topLevelType.indexOf("top") === 0) {
            topLevelType = topLevelType.slice(3).toLowerCase();
        }

        eventSystem.dispatchEvent(fakeNativeEvent, topLevelType);
    },

    simulateNativeEventOnDOMComponent(topLevelType: string, comp: any, fakeNativeEvent: any) {
        ReactTestUtils.simulateNativeEventOnNode(topLevelType, findDOMNode(comp), fakeNativeEvent);
    },

    nativeTouchData(x: number, y: number) {
        return {
            touches: [{ pageX: x, pageY: y }],
        };
    },

    Simulate: {},
    SimulateNative: {},
};
// ReactTestUtils.Simulate.click(element, options)
[
    "click",
    "change",
    "keyDown",
    "keyUp",
    "KeyPress",
    "mouseDown",
    "mouseUp",
    "mouseMove",
    "input",
    "focus",
    "blur",
].forEach((name) => {
    (ReactTestUtils.Simulate as any)[name] = function _(node: any, opts: any) {
        if (!node || node.nodeType !== 1) {
            throw TypeError("第一个参数必须为元素节点");
        }
        const fakeNativeEvent = opts || {};
        const fakeTarget = fakeNativeEvent.target;
        if (fakeTarget && !fakeTarget.appendChild) {
            for (const i in fakeTarget) {
                node[i] = fakeTarget[i];
            }
        }

        fakeNativeEvent.target = node;

        fakeNativeEvent.simulated = true;
        const eventName = name.toLowerCase();
        fakeNativeEvent.type = eventName;
        const fn = node["on" + eventName];

        eventSystem.dispatchEvent(fakeNativeEvent, eventName);
        if (fn) {
            try {
                fn.call(node, fakeNativeEvent);
            } catch (e) { }
        }

    };
});
ReactTestUtils.SimulateNative = ReactTestUtils.Simulate;
export default ReactTestUtils;
