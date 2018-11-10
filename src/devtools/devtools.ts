import { IFiber } from "../fiber/type-shared";
import { OwnerType, VNodeType, IBaseObject, IBaseProps, IAnuElement } from "../core/type-shared";

import { findDOMNode } from "zreact";

const options = {
    roots: {},
};
const roots: {[name: string]: IReactVNode} = options.roots;
const instanceMap = new Map<Element, IReactVNode>();

function getKeyForVNode(vnode: IFiber) {
    return vnode.stateNode as Element;
}

function getInstanceFromVNode(vnode: IFiber): IReactVNode|undefined {
    const key = getKeyForVNode(vnode);
    return instanceMap.get(key);
}

interface IReactVNode {
    _currentElement: any;
    _inDevTools?: boolean;
    _stringText?: string|null;
    _instance?: OwnerType;
    _renderedChildren?: IReactVNode[]|boolean;
    _renderedComponent?: IReactVNode|null;
    _rootID?: string;
    state?: IBaseObject;
    props?: IBaseProps;
    node: Element;
    type?: VNodeType;
    forceUpdate?: any;
    setState?: any;
    isTop?: boolean;
    getName?(): string;
}

function findVNodeFromDOM(vnode: IReactVNode|null, dom: Element): IReactVNode|undefined {
    if (!vnode) {
        for (const i in roots) {
            const root = roots[i];
            const result = findVNodeFromDOM(root, dom);
            if (result) {
                return result;
            }
        }
    } else {
        if (vnode.node === dom) {
            // 如果是原子虚拟DOM，直接比较 _hostNode === dom
            return vnode;
        }

        const children = vnode._renderedChildren;

        if (children) {
            for (const child of children as IReactVNode[]) {
                if (child) {
                    const _result = findVNodeFromDOM(child, dom);
                    if (_result) {
                        return _result;
                    }
                }
            }
        }
    }
}

function normalizeChildren(vnode: IFiber, dom: Element) {
    const ret: IReactVNode[] = [];
    for (let a = vnode.child; a; a = a.sibling) {
        const v = updateReactComponent(a, dom);
        if (v) {
            ret.push(v);
        }
    }
    return ret;
}

function updateReactComponent(vnode: IFiber, parentDom?: Element): IReactVNode|null {
    if (!vnode) {
        return null;
    }
    let newInstance: IReactVNode|null = null;

    if (vnode.tag === 5 && vnode.hostRoot) {
        newInstance = createReactBaseComponent(vnode, vnode.hostRoot);
    } else if (vnode.tag < 3) {
        newInstance = createReactBaseComponent(vnode, vnode.stateNode);
    } else {
        newInstance = createReactDOMComponent(vnode, parentDom);
    }

    const oldInstance = getInstanceFromVNode(vnode);

    if (oldInstance) {
        Object.assign(oldInstance, newInstance);
        return oldInstance;
    }
    const key = getKeyForVNode(vnode);
    // 将它存入instanceMap中
    if (key) {
        instanceMap.set(key, newInstance as IReactVNode);
    }
    return newInstance;
}
function createReactBaseComponent(vnode: IFiber, instance: OwnerType): IReactVNode {
    const type = vnode.type;
    const typeName = (type as any).displayName || (type as any).name;
    const dom: Element = findDOMNode(instance);
    const data: IReactVNode = {
        getName() {
            return typeName;
        },
        type,
        _instance: instance,
        state: instance.state,
        node: dom,
        props: instance.props as IBaseProps,
        _currentElement: {
            type,
            key: normalizeKey(vnode.key as string),
            props: vnode.props,
            ref: vnode.ref,
        },
        forceUpdate: instance.forceUpdate && instance.forceUpdate.bind(instance),
        setState: instance.setState && instance.setState.bind(instance),
    };
    const renderedChildren: IReactVNode[] = normalizeChildren(vnode, dom);
    if (renderedChildren.length === 1) {
        data._renderedComponent = renderedChildren[0];
    } else if (renderedChildren.length > 0) {
        data._renderedChildren = renderedChildren;
    }
    return data;
}

function createReactDOMComponent(vnode: IFiber, parentDom?: Element): IReactVNode|null {
    const type = vnode.type;
    if (
        type === "#comment" ||
        vnode === null ||
        vnode === undefined ||
        (vnode as any) === true ||
        (vnode as any) === false
    ) {
        return null;
    }
    const props = vnode.props;
    const dom = vnode.stateNode;

    const isText = typeof vnode !== "object" || type === "#text";

    const data: IReactVNode =  {
        _currentElement: isText
            ? vnode.text + ""
            : {
                type,
                props,
                key: normalizeKey(vnode.key as string),
            },
        _inDevTools: false,
        _renderedChildren: !isText && normalizeChildren(vnode, dom as Element),
        _stringText: isText ? vnode.text + "" : null,
        node: dom as Element || parentDom,
    };
    return data;
}

function normalizeKey(key: string): string {
    if (key && key[0] === ".") {
        return key.substr(1);
    }
    return key;
}

function nextRootKey(rootItems: any): string {
    return "." + Object.keys(rootItems).length;
}

// 是否为根节点的虚拟DOM
function isRootVNode(vnode: IReactVNode) {
    if (vnode.isTop) {
        return vnode;
    }
    // TODO 判断是否为根节点的方法和 preact 流程不一样，这里有可能有问题
    for (const i in roots) {
        if (roots[i] === vnode) {
            return true;
        }
    }
    return false;
}

/**
 * roots里面都是经过
 *
 * @param node
 * @param roots
 */
function findRoots(node: Element, rootItems: {[key: string]: IReactVNode}) {
    Array.from(node.childNodes || []).forEach(function _(child: Node) {
        const vnode = (child as IAnuElement).$reactInternalFiber;
        if (vnode) {
            const v = updateReactComponent(vnode);
            if (v) {
                rootItems[nextRootKey(rootItems)] = v;
            }
        } else {
            findRoots(child as Element, rootItems);
        }
    });
}

function visitNonCompositeChildren(instance: IReactVNode, callback: any) {
    if (!instance) {
        return;
    }
    if (instance._renderedComponent) {
        callback(instance._renderedComponent);
        visitNonCompositeChildren(instance._renderedComponent, callback);
    } else if (instance._renderedChildren) {
        (instance._renderedChildren as IReactVNode[]).forEach(function _(child: IReactVNode) {
            if (child) {
                callback(child);
                visitNonCompositeChildren(child, callback);
            }
        });
    }
}

function createDevToolsBridge() {
    console.log("createDevToolsBridge.....");
    const ComponentTree = {
        getNodeFromInstance(instance) {
            // createReactDOMComponent生成的实例有vnode对象
            return instance.node;
        },
        getClosestInstanceFromNode(dom) {
            const vnode = findVNodeFromDOM(null, dom);
            // 转换为ReactCompositeComponent或ReactDOMComponent
            return vnode ? updateReactComponent(vnode as any, null) : null;
        },
    };

    // Map of root ID (the ID is unimportant) to component instance.
    // 会根据vnode创建实例，并保存在instanceMap与roots中
    if (document.readyState === "complete") {
        findRoots(document.body, roots);
    } else {
        const id = setInterval(function _() {
            if (document.readyState === "complete") {
                clearInterval(id);
                findRoots(document.body, roots);
            }
        }, 100);
    }
    const Mount = {
        _instancesByReactRootID: roots,
        // tslint:disable-next-line:no-empty
        _renderNewRootComponent(instance) {
        },
    };

    const Reconciler = {
        // tslint:disable-next-line:no-empty
        mountComponent() {},

        // tslint:disable-next-line:no-empty
        performUpdateIfNecessary() {},

        // tslint:disable-next-line:no-empty
        receiveComponent() {},

        // tslint:disable-next-line:no-empty
        unmountComponent() {},
    };

    // ============

    const queuedMountComponents = new Map();
    const queuedReceiveComponents = new Map();
    const queuedUnmountComponents = new Map();

    const queueUpdate = function _queueUpdate(updater, map, component) {
        if (!map.has(component)) {
            map.set(component, true);
            requestAnimationFrame(function __() {
                updater(component);
                map.delete(component);
            });
        }
    };

    const queueMountComponent = function _queueMountComponent(component) {
        return queueUpdate(
            Reconciler.mountComponent,
            queuedMountComponents,
            component,
        );
    };
    const queueReceiveComponent = function _queueReceiveComponent(component) {
        return queueUpdate(
            Reconciler.receiveComponent,
            queuedReceiveComponents,
            component,
        );
    };
    const queueUnmountComponent = function _queueUnmountComponent(component) {
        return queueUpdate(
            Reconciler.unmountComponent,
            queuedUnmountComponents,
            component,
        );
    };

    // 创建 componentAdded， componentUpdated，componentRemoved三个重要钩子
    const componentAdded = function _componentAdded(vnode) {
        const instance = updateReactComponent(vnode);
        // 将_currentElement代替为ReactCompositeComponent实例
        if (isRootVNode(vnode)) {
            instance._rootID = nextRootKey(roots);
            roots[instance._rootID] = instance;
            Mount._renderNewRootComponent(instance);
        }
        // 遍历非实组件的孩子
        visitNonCompositeChildren(instance, function _(childInst) {
            if (childInst) {
                childInst._inDevTools = true;
                queueMountComponent(childInst);
            }
        });
        queueMountComponent(instance);
    };

    const componentUpdated = function _componentUpdated(vnode) {
        const prevRenderedChildren = [];

        // 通过anujs instance得到 ReactCompositeComponent实例
        visitNonCompositeChildren(instanceMap.get(vnode), function _(
            childInst,
        ) {
            prevRenderedChildren.push(childInst);
        });

        const instance = updateReactComponent(vnode);
        queueReceiveComponent(instance);
        visitNonCompositeChildren(instance, function _(childInst) {
            if (!childInst._inDevTools) {
                // New DOM child component
                childInst._inDevTools = true;
                queueMountComponent(childInst);
            } else {
                // Updated DOM child component
                queueReceiveComponent(childInst);
            }
        });

        prevRenderedChildren.forEach(function _(childInst) {
            if (!document.body.contains(childInst.node)) {
                instanceMap.delete(childInst.node);
                queueUnmountComponent(childInst);
            }
        });
    };

    const componentRemoved = function _componentRemoved(vnode) {
        const instance = updateReactComponent(vnode);

        visitNonCompositeChildren(instance, function _(childInst) {
            instanceMap.delete(childInst.node);
            queueUnmountComponent(childInst);
        });
        queueUnmountComponent(instance);
        instanceMap.delete(vnode);
        if (instance._rootID) {
            delete roots[instance._rootID];
        }
    };

    return {
        componentAdded,
        componentUpdated,
        componentRemoved,

        ComponentTree,
        Mount,
        Reconciler,
        version: "16.5.0",
        bundleType: 1,
        rendererPackageName: "react-dom",
    };
}

export function initDevTools() {
    /* tslint:disable */
    console.log("初始chrome react 调试工具");
    const bridge = createDevToolsBridge();
    const Methods = {
        afterMount: "componentAdded",
        afterUpdate: "componentUpdated",
        beforeUnmount: "componentRemoved"
    };
    for (const name in Methods) {
        (function _(key, alias) {
            const oldMethod = options[key];
            //重写anujs原有的方法
            options[key] = function(instance) {
                const updater = instance.updater;//1.2.8
                const vnode = updater.$reactInternalFiber;
                bridge[alias](vnode);
                if (oldMethod) {
                    oldMethod(vnode);
                }
            };
        })(name, Methods[name]);
    }

    window["__REACT_DEVTOOLS_GLOBAL_HOOK__"].inject(bridge);
}
