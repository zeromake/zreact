import { options, Component} from "./zreact";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";

interface IReactElement {
    props?: boolean|IKeyValue;
    type: any;
    ref?: ((c: Component<IKeyValue, IKeyValue>|null) => void)|null;
    key?: string;
}
interface IReactComponent {
    _currentElement: IReactElement|string|null;
    node?: Text|Element|Node;
    _instance?: Component<IKeyValue, IKeyValue>;
    _renderedComponent?: IReactComponent;
    forceUpdate?: () => void;
    getName?: () => void;
    props?: IKeyValue;
    setState?: () => void;
    state?: IKeyValue;
    _inDevTools?: boolean;
    _renderedChildren?: IReactComponent[];
    _stringText?: null|string;
    _rootID?: string;
    _component?: any;
}

declare const window: {
    $zreact: IVDom,
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any,
};

declare class Map {
    public has(key: any): boolean;
    public get(key: any): any;
    public set(key: any, val: any): void;
    public delete(key: any): void;
}

/**
 * 将zreact的component实例转换为React的
 * @param  component
 */
function createReactElement(component: Component<IKeyValue, IKeyValue>): IReactElement {
    const element: IReactElement = {
        key: component._key,
        props: component.props,
        ref: null, // Unsupported
        type: component.constructor,
    };
    return element;
}

/**
 * 获取组件名
 * @param  element
 */
function typeName(element: IReactElement): string {
    if (typeof element.type === "function") {
        return element.type.displayName || element.type.name;
    }
    return element.type;
}
/**
 * 将component转换实例
 * @param component
 */
function createReactCompositeComponent(component: Component<IKeyValue, IKeyValue>): IReactComponent {
    const _currentElement = createReactElement(component);
    const node = component.vdom && component.vdom.base;
    const instance: IReactComponent = {
        _currentElement,
        _instance: component,
        forceUpdate: component.forceUpdate && component.forceUpdate.bind(component),
        getName: function getName() {
            return typeName(_currentElement);
        },
        node,
        props: component.props,
        setState: component.setState && component.setState.bind(component),
        state: component.state,
    };
    if (component._component) {
        instance._renderedComponent = updateReactComponent(component._component);
    } else if (component.vdom) {
        instance._renderedComponent = updateReactComponent(component.vdom);
    }
    return instance;
}

/**
 * 将vdom转换为实例
 * @param vdom
 */
function createReactDOMComponent(vdom: IVDom): IReactComponent {
    const node = vdom.base;
    const childNodes = node.nodeType === Node.ELEMENT_NODE ?
        Array.prototype.slice.call(node.childNodes, 0) : [];
    const isText = node.nodeType === Node.TEXT_NODE;
    let element: string|IReactElement|null;
    if (isText) {
        element = node.textContent;
    } else {
        element = {
            props: vdom.props,
            type: node.nodeName.toLowerCase(),
        };
    }
    const children: IReactComponent[] = new Array();
    childNodes.forEach(function _(child: any) {
        if (child._vdom) {
            let component: IReactComponent;
            if (child._vdom.component) {
                component = updateReactComponent(child._vdom.component);
            } else {
                component = updateReactComponent(child._vdom);
            }
            children.push(component);
        }
    })
    return {
        _currentElement: element,
        _inDevTools: false,
        _renderedChildren: children,
        _stringText: isText ? node.textContent : null,
        node,
    };
}
const instanceMap = new Map();
/**
 * 将vdom或component转换为实例
 * @param componentOrVDom
 */
function updateReactComponent(componentOrVDom: any): IReactComponent {
    const isVDom = componentOrVDom.base != null;
    const newInstance = isVDom ? createReactDOMComponent(componentOrVDom) : createReactCompositeComponent(componentOrVDom);
    const base = isVDom ? componentOrVDom.base : componentOrVDom;
    if (instanceMap.has(base)) {
        const inst = instanceMap.get(base);
        (Object as any).assign(inst, newInstance);
        return inst;
    }
    instanceMap.set(base, newInstance);
    return newInstance;
}

function nextRootKey(roots: IKeyValue) {
    return "." + Object.keys(roots).length;
}

function findRoots(node: Element, roots: IKeyValue) {
    Array.prototype.forEach.call(node.childNodes, function _(child: any) {
        if (child._vdom && child._vdom.component) {
            roots[nextRootKey(roots)] = updateReactComponent(child._vdom.component);
        } else {
            findRoots(child, roots);
        }
    });
}

function isRootComponent(component: Component<IKeyValue, IKeyValue>) {
    if (component._parentComponent) {
        return false;
    }
    const parentElement: any = component.vdom && component.vdom.base && component.vdom.base.parentElement && component.vdom.base.parentElement;
    const vdom = parentElement._vdom;
    if (vdom && vdom.props) {
        return false;
    }
    return true;
}

function visitNonCompositeChildren(component: IReactComponent, visitor: (arg: IReactComponent) => void) {
    if (component._renderedComponent) {
        if (!component._renderedComponent._component) {
            visitor(component._renderedComponent);
            visitNonCompositeChildren(component._renderedComponent, visitor);
        }
    } else if (component._renderedChildren) {
        component._renderedChildren.forEach(function _(child) {
            visitor(child);
            if (!child._component) {
                visitNonCompositeChildren(child, visitor);
            }
        });
    }
}

function createDevToolsBridge(vdom?: IVDom) {
    const ComponentTree = {
        getClosestInstanceFromNode: function getClosestInstanceFromNode(node: any) {
            while (node && !node._vdom) {
                node = node.parentNode;
            }
            return node ? updateReactComponent(node._vdom.component) : null;
        },
        getNodeFromInstance: function getNodeFromInstance(instance: IReactComponent) {
            return instance.node;
        },
    };

    const roots: {
        [name: string]: IReactComponent;
    } = {};
    if (vdom && vdom.component) {
        roots[".0"] = updateReactComponent(vdom.component);
    } else {
        if (window.$zreact) {
            const keys = Object.keys(roots);
            if (keys.length > 0) {
                keys.forEach((key) => {
                    delete roots[key];
                });
            }
            roots[".0"] = updateReactComponent(window.$zreact);
        } else {
            findRoots(document.body, roots);
        }
    }
    // findRoots(document.body, roots);

    const Mount = {
        _instancesByReactRootID: roots,
        _renderNewRootComponent: function _renderNewRootComponent(arg: IReactComponent){},
    };
    const Reconciler = {
        mountComponent: function mountComponent(arg: IReactComponent){},
        performUpdateIfNecessary: function performUpdateIfNecessary(){},
        receiveComponent: function receiveComponent(arg: IReactComponent){},
        unmountComponent: function unmountComponent(arg: IReactComponent){},
    };
    const componentAdded = function componentAdded_(component: Component<IKeyValue, IKeyValue>) {
        const instance = updateReactComponent(component);
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
    const componentUpdated = function componentUpdated_(component: Component<IKeyValue, IKeyValue>) {
        const prevRenderedChildren: IReactComponent[] = [];
        visitNonCompositeChildren(instanceMap.get(component), function _(childInst: IReactComponent) {
            prevRenderedChildren.push(childInst);
        });
        const instance = updateReactComponent(component);
        Reconciler.receiveComponent(instance);
        visitNonCompositeChildren(instance, function _(childInst: IReactComponent) {
            if (!childInst._inDevTools) {
                childInst._inDevTools = true;
                Reconciler.mountComponent(childInst);
            } else {
                Reconciler.receiveComponent(childInst);
            }
        });
        prevRenderedChildren.forEach(function _(childInst: IReactComponent) {
            if (childInst.node && !document.body.contains(childInst.node)) {
                instanceMap.delete(childInst.node);
                Reconciler.unmountComponent(childInst);
            }
        });
    };
    const componentRemoved = function componentRemoved_(component: Component<IKeyValue, IKeyValue>) {
        const instance = updateReactComponent(component);
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
        ComponentTree,
        Mount,
        Reconciler,
        componentAdded,
        componentRemoved,
        componentUpdated,
    };
}

export function getInitDevTools(opt: typeof options) {
    return function initDevTools(vdom?: IVDom) {
        if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined") {
            return;
        }
        const bridge = createDevToolsBridge(vdom);
        const nextAfterMount = opt.afterMount;
        opt.afterMount = (component: Component<IKeyValue, IKeyValue>) => {
            bridge.componentAdded(component);
            if (nextAfterMount) {
                nextAfterMount(component);
            }
        };
        const nextAfterUpdate = opt.afterUpdate;
        opt.afterUpdate = (component: Component<IKeyValue, IKeyValue>) => {
            bridge.componentUpdated(component);
            if (nextAfterUpdate) {
                nextAfterUpdate(component);
            }
        };
        const nextBeforeUnmount = opt.beforeUnmount;
        opt.beforeUnmount = (component: Component<IKeyValue, IKeyValue>) => {
            bridge.componentRemoved(component);
            if (nextBeforeUnmount) {
                nextBeforeUnmount(component);
            }
        };
        // Notify devtools about this instance of "React"
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject(bridge);
        return () => {
            opt.afterMount = nextAfterMount;
            opt.afterUpdate = nextAfterUpdate;
            opt.beforeUnmount = nextBeforeUnmount;
        };
    };
}
