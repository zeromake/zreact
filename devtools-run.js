(function (zreact) {
'use strict';

function getInitDevTools(opt, findDOMNode$$1, findVDom$$1) {
    /**
     * 将zreact的component实例转换为React的
     * @param  component
     */
    function createReactElement(component) {
        var element = {
            key: component._key,
            props: component.props,
            ref: null,
            type: component.constructor,
        };
        return element;
    }
    /**
     * 获取组件名
     * @param  element
     */
    function typeName(element) {
        if (typeof element.type === "function") {
            return element.type.displayName || element.type.name;
        }
        return element.type;
    }
    /**
     * 将component转换实例
     * @param component
     */
    function createReactCompositeComponent(component) {
        var _currentElement = createReactElement(component);
        var node = findDOMNode$$1(component);
        var instance = {
            _currentElement: _currentElement,
            _instance: component,
            forceUpdate: component.forceUpdate && component.forceUpdate.bind(component),
            getName: function getName() {
                return typeName(_currentElement);
            },
            node: node,
            props: component.props,
            setState: component.setState && component.setState.bind(component),
            state: component.state,
        };
        if (component._component) {
            instance._renderedComponent = updateReactComponent(component._component);
        }
        else if (findVDom$$1(component)) {
            instance._renderedComponent = updateReactComponent(findVDom$$1(component));
        }
        return instance;
    }
    /**
     * 将vdom转换为实例
     * @param vdom
     */
    function createReactDOMComponent(vdom) {
        var node = findDOMNode$$1(vdom);
        var childNodes = node.nodeType === Node.ELEMENT_NODE ?
            Array.prototype.slice.call(node.childNodes, 0) : [];
        var isText = node.nodeType === Node.TEXT_NODE;
        var element;
        if (isText) {
            element = node.textContent;
        }
        else {
            element = {
                props: vdom.props,
                type: node.nodeName.toLowerCase(),
            };
        }
        var children = new Array();
        childNodes.forEach(function _(child) {
            var childVDom = findVDom$$1(child);
            if (childVDom) {
                var component = void 0;
                if (childVDom.component) {
                    component = updateReactComponent(childVDom.component);
                }
                else {
                    component = updateReactComponent(childVDom);
                }
                children.push(component);
            }
        });
        return {
            _currentElement: element,
            _inDevTools: false,
            _renderedChildren: children,
            _stringText: isText ? node.textContent : null,
            node: node,
        };
    }
    var instanceMap = new Map();
    /**
     * 将vdom或component转换为实例
     * @param componentOrVDom
     */
    function updateReactComponent(componentOrVDom) {
        var isVDom = findVDom$$1(componentOrVDom) == null;
        var newInstance = isVDom ? createReactDOMComponent(componentOrVDom) : createReactCompositeComponent(componentOrVDom);
        if (!isVDom) {
            console.log(componentOrVDom);
        }
        var base = isVDom ? findDOMNode$$1(componentOrVDom) : componentOrVDom;
        if (instanceMap.has(base)) {
            var inst = instanceMap.get(base);
            Object.assign(inst, newInstance);
            return inst;
        }
        instanceMap.set(base, newInstance);
        return newInstance;
    }
    function nextRootKey(roots) {
        return "." + Object.keys(roots).length;
    }
    function findRoots(node, roots) {
        Array.prototype.forEach.call(node.childNodes, function _(child) {
            var vdom = findVDom$$1(child);
            if (vdom && vdom.component) {
                roots[nextRootKey(roots)] = updateReactComponent(vdom.component);
            }
            else {
                findRoots(child, roots);
            }
        });
    }
    function isRootComponent(component) {
        if (component._parentComponent) {
            return false;
        }
        var base = findDOMNode$$1(component);
        var parentElement = base && base.parentElement;
        var vdom = findVDom$$1(parentElement);
        if (vdom && vdom.props) {
            return false;
        }
        return true;
    }
    function visitNonCompositeChildren(component, visitor) {
        if (component._renderedComponent) {
            if (!component._renderedComponent._component) {
                visitor(component._renderedComponent);
                visitNonCompositeChildren(component._renderedComponent, visitor);
            }
        }
        else if (component._renderedChildren) {
            component._renderedChildren.forEach(function _(child) {
                visitor(child);
                if (!child._component) {
                    visitNonCompositeChildren(child, visitor);
                }
            });
        }
    }
    function createDevToolsBridge(vdom) {
        var ComponentTree = {
            getClosestInstanceFromNode: function getClosestInstanceFromNode(node) {
                while (node && !findVDom$$1(node)) {
                    node = node.parentNode;
                }
                return node ? updateReactComponent(findVDom$$1(node).component) : null;
            },
            getNodeFromInstance: function getNodeFromInstance(instance) {
                return instance.node;
            },
        };
        var roots = {};
        if (vdom && vdom.component) {
            roots[".0"] = updateReactComponent(vdom.component);
        }
        else {
            findRoots(document.body, roots);
        }
        // findRoots(document.body, roots);
        var Mount = {
            _instancesByReactRootID: roots,
            _renderNewRootComponent: function _renderNewRootComponent(arg) { },
        };
        var Reconciler = {
            mountComponent: function mountComponent(arg) { },
            performUpdateIfNecessary: function performUpdateIfNecessary() { },
            receiveComponent: function receiveComponent(arg) { },
            unmountComponent: function unmountComponent(arg) { },
        };
        var componentAdded = function componentAdded_(component) {
            var instance = updateReactComponent(component);
            if (isRootComponent(component)) {
                instance._rootID = nextRootKey(roots);
                roots[instance._rootID] = instance;
                Mount._renderNewRootComponent(instance);
            }
            visitNonCompositeChildren(instance, function _(childInst) {
                childInst._inDevTools = true;
                Reconciler.mountComponent(childInst);
            });
            Reconciler.mountComponent(instance);
        };
        var componentUpdated = function componentUpdated_(component) {
            var prevRenderedChildren = [];
            visitNonCompositeChildren(instanceMap.get(component), function _(childInst) {
                prevRenderedChildren.push(childInst);
            });
            var instance = updateReactComponent(component);
            Reconciler.receiveComponent(instance);
            visitNonCompositeChildren(instance, function _(childInst) {
                if (!childInst._inDevTools) {
                    childInst._inDevTools = true;
                    Reconciler.mountComponent(childInst);
                }
                else {
                    Reconciler.receiveComponent(childInst);
                }
            });
            prevRenderedChildren.forEach(function _(childInst) {
                if (childInst.node && !document.body.contains(childInst.node)) {
                    instanceMap.delete(childInst.node);
                    Reconciler.unmountComponent(childInst);
                }
            });
        };
        var componentRemoved = function componentRemoved_(component) {
            var instance = updateReactComponent(component);
            visitNonCompositeChildren(instance, function _(childInst) {
                instanceMap.delete(childInst.node);
                Reconciler.unmountComponent(childInst);
            });
            Reconciler.unmountComponent(instance);
            instanceMap.delete(component);
            if (instance._rootID) {
                delete roots[instance._rootID];
            }
        };
        return {
            ComponentTree: ComponentTree,
            Mount: Mount,
            Reconciler: Reconciler,
            componentAdded: componentAdded,
            componentRemoved: componentRemoved,
            componentUpdated: componentUpdated,
        };
    }
    return function initDevTools(vdom) {
        if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
            return;
        }
        var bridge = createDevToolsBridge(vdom);
        var nextAfterMount = opt.afterMount;
        opt.afterMount = function (component) {
            bridge.componentAdded(component);
            if (nextAfterMount) {
                nextAfterMount(component);
            }
        };
        var nextAfterUpdate = opt.afterUpdate;
        opt.afterUpdate = function (component) {
            bridge.componentUpdated(component);
            if (nextAfterUpdate) {
                nextAfterUpdate(component);
            }
        };
        var nextBeforeUnmount = opt.beforeUnmount;
        opt.beforeUnmount = function (component) {
            bridge.componentRemoved(component);
            if (nextBeforeUnmount) {
                nextBeforeUnmount(component);
            }
        };
        // Notify devtools about this instance of "React"
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(bridge);
        return function () {
            opt.afterMount = nextAfterMount;
            opt.afterUpdate = nextAfterUpdate;
            opt.beforeUnmount = nextBeforeUnmount;
        };
    };
}

var initDevTools = getInitDevTools(zreact.options, zreact.findDOMNode, zreact.findVDom);
initDevTools();

}(zreact));
//# sourceMappingURL=devtools-run.js.map
