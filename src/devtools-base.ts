import { options, Component, findDOMNode as IfindDOMNode, findVDom as IfindVDom} from "./zreact";
import { IKeyValue } from "./types";
import { IVDom } from "./vdom/index";

const isArray = Array.isArray;
enum ComponentChildType {
    COMPONENT = 0,
    DOM = 1,
}

interface IComponentChild {
    type: ComponentChildType;
    index: number;
}

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

export function getInitDevTools(opt: typeof options, findDOMNode: typeof IfindDOMNode, findVDom: typeof IfindVDom) {

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
        const node = findDOMNode(component);
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
        // const updateChild = function _() {
        if (component._component) {
            instance._renderedComponent = updateReactComponent(component._component);
        } else {
            const vdom: IVDom = findVDom(component) as IVDom;
            if (vdom && vdom.base != null) {
                instance._renderedComponent = updateReactComponent(vdom);
            }
        }
        // };
        // if (component._children != null) {
        //     const childrenLen = component._children.length;
        //     if (childrenLen > 0) {
        //         if (childrenLen === 1) {
        //             updateChild();
        //         } else {
        //             const vdom = findVDom(component) as IVDom[];
        //             const children: IReactComponent[] = [];
        //             component._children.forEach((item) => {
        //                 let obj: Component<IKeyValue, IKeyValue> | IVDom | null = null;
        //                 if (item.type === 0) {
        //                     obj = (component._component as Array<Component<IKeyValue, IKeyValue>>)[item.index];
        //                 } else if (item.type === 1) {
        //                     obj = (vdom as IVDom[])[item.index];
        //                 }
        //                 if (obj != null) {
        //                     children.push(updateReactComponent(obj));
        //                 }
        //             });
        //             instance._renderedChildren = children;
        //         }
        //     }
        // } else {
        // updateChild();
        // }
        return instance;
    }

    /**
     * 将vdom转换为实例
     * @param vdom
     */
    function createReactDOMComponent(vdom: IVDom): IReactComponent {
        const node = findDOMNode(vdom);
        const childNodes = node && node.nodeType === Node.ELEMENT_NODE ?
            Array.prototype.slice.call(node.childNodes, 0) : [];
        const isText = node && node.nodeType === Node.TEXT_NODE;
        let element: string|IReactElement|null;
        if (isText) {
            element = node.textContent;
        } else {
            element = {
                props: vdom.props,
                type: node ? node.nodeName.toLowerCase() : "undefined",
            };
        }
        const children: IReactComponent[] = new Array();
        let offset = 0;
        const voidNode = node && (node as any)._voidNode;
        let len = childNodes.length;
        let voidLen = 0;
        if (voidNode) {
            for (const key in voidNode) {
                voidLen ++;
            }
        }
        if (len > 0) {
            len += voidLen;
            for (let i = 0; i + offset < len; i++) {
                let component: IReactComponent | undefined;
                if (voidLen > 0 && voidNode && (i + offset) in voidNode) {
                    component = updateReactComponent(voidNode[(i + offset)].component);
                    offset ++;
                    i --;
                    children.push(component);
                    continue;
                }
                const childVDom = findVDom(childNodes[i]) as IVDom;
                if (childVDom && childVDom.component) {
                    component = updateReactComponent(childVDom.component);
                } else if (childVDom) {
                    component = updateReactComponent(childVDom);
                }
                if (component) {
                    children.push(component);
                }
            }
        } else if (voidNode > 0) {
            for (const key in voidNode) {
                let component: IReactComponent;
                component = updateReactComponent(voidNode[key].component);
                children.push(component);
            }
        }
        // childNodes.forEach(function _(child: any) {
        //     const childVDom = findVDom(child);
        //     if (childVDom) {
        //         let component: IReactComponent;
        //         if (childVDom.component) {
        //             component = updateReactComponent(childVDom.component);
        //         } else {
        //             component = updateReactComponent(childVDom);
        //         }
        //         children.push(component);
        //     }
        // });
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
        const isVDom = findVDom(componentOrVDom) == null;
        const newInstance = isVDom ? createReactDOMComponent(componentOrVDom) : createReactCompositeComponent(componentOrVDom);
        const base: Element | Component<any, any> = isVDom ? findDOMNode(componentOrVDom) : componentOrVDom;
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
            const vdom = findVDom(child) as IVDom;
            if (vdom) {
                if (vdom.component) {
                    roots[nextRootKey(roots)] = updateReactComponent(vdom.component);
                } else {
                    roots[nextRootKey(roots)] = updateReactComponent(vdom);
                }
            } else {
                findRoots(child, roots);
            }
        });
    }

    function isRootComponent(component: Component<IKeyValue, IKeyValue>) {
        if (component._parentComponent) {
            return false;
        }
        const base = findDOMNode(component);
        const parentElement: any = base && base.parentElement;
        const vdom = findVDom(parentElement) as IVDom;
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
                while (node && !findVDom(node)) {
                    node = node.parentNode;
                }
                return node ? updateReactComponent((findVDom(node) as IVDom).component) : null;
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
            findRoots(document.body, roots);
        }
        // findRoots(document.body, roots);

        const Mount = {
            _instancesByReactRootID: roots,
            _renderNewRootComponent: function _renderNewRootComponent(arg: IReactComponent) {},
        };
        const Reconciler = {
            mountComponent: function mountComponent(arg: IReactComponent) {},
            performUpdateIfNecessary: function performUpdateIfNecessary() {},
            receiveComponent: function receiveComponent(arg: IReactComponent) {},
            unmountComponent: function unmountComponent(arg: IReactComponent) {},
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
            const node = findDOMNode(component);
            if (!instanceMap.has(node)) {
                componentAdded(component);
                return;
            }
            visitNonCompositeChildren(instanceMap.get(node), function _(childInst: IReactComponent) {
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
