import { IBaseProps, IBaseObject, VirtualNodeList, VirtualNode, VNodeType, IRefType, IVNode, ChildrenType } from "./type-shared";
import { hasOwnProperty, typeNumber, REACT_ELEMENT_TYPE, hasSymbol } from "./util";
import { Renderer } from "./create-renderer";
import { Component } from "./component";

const RESERVED_PROPS = {
    key: true,
    ref: true,
};

function makeProps(type: VNodeType, config: IBaseProps, props: IBaseProps, children: VirtualNodeList, len: number): IBaseProps {
    // const props: IBaseProps = {};
    for (const propName in config) {
        if (hasOwnProperty.call(config, propName) && !hasOwnProperty.call(RESERVED_PROPS, propName)) {
            props[propName] = config[propName];
        }
    }
    if (typeof type === "function" && (type as any).defaultProps != null) {
        const defaultProps: IBaseObject = (type as any).defaultProps;
        for (const propName in defaultProps) {
            if (!(propName in props)) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (len === 1) {
        props.children = children[0] as VirtualNode;
    } else if (len > 1) {
        props.children = children as VirtualNode[];
    }
    return props;
}

function hasValidRef(config: IBaseProps): boolean {
    return config.ref !== undefined;
}

function hasVaildKey(config: IBaseProps): boolean {
    return config.key !== undefined;
}

export function createElement(type: VNodeType, config?: IBaseProps|null, ...children: VirtualNodeList): IVNode {
    let tag: number = 5;
    let key: string|null = null;
    let ref: IRefType|undefined;
    const argsLen = children.length;
    if (typeof type === "function") {
        tag = type.prototype.render != null ? 1 : 2;
    }
    if (config != null) {
        if (hasValidRef(config)) {
            ref = config.ref;
        }
        if (hasVaildKey(config)) {
            key = config.key + "";
        }
    }
    let props: IBaseProps = {};
    props = makeProps(type, config || {}, props, children, argsLen);
    return ReactElement(type, tag, props, key, ref, Renderer.currentOwner);
}

export function cloneElement(element: IVNode, config?: IBaseProps, ...children: VirtualNodeList): IVNode {
    let props = {...element.props};
    const { type, tag } = element;
    let { $owner: owner, ref, key } = element;
    const argsLen = children.length;
    if (config != null) {
        if (hasVaildKey(config)) {
            key = config.key + "";
        }
        if (hasValidRef(config)) {
            ref = config.ref;
            owner = Renderer.currentOwner;
        }
    }
    props = makeProps(type, config || {}, props as IBaseProps, children, argsLen);
    return ReactElement(type, tag, props, key, ref, owner);
}

function ReactElement(type: VNodeType, tag: number, props: IBaseProps, key?: string | null, ref?: IRefType, owner?: IVNode|null): IVNode {
    const vnode: IVNode = {
        type,
        tag,
        props,
    };
    if (tag !== 6) {
        vnode.$$typeof = REACT_ELEMENT_TYPE;
        vnode.ref = ref;
        vnode.key = key || null;
        vnode.$owner = owner;
    }
    return vnode;
}

export function isValidElement(element: any): boolean {
    return !!element && element.$$typeof === REACT_ELEMENT_TYPE;
}

export function createFactory(type: VNodeType) {
    const factory = createElement.bind(null, type);
    factory.type = type;
    return factory;
}

export function createVText(text: any): IVNode {
    const vnode = ReactElement("#text", 6, {});
    vnode.text = "" + text;
    return vnode;
}

const escapeRegex = /[=:]/g;
const escaperLookup: IBaseObject = {
    "=": "=0",
    ":": "=2",
};

function escape(key: string) {
    return "$" + ("" + key).replace(escapeRegex, function _(match: string) {
        return escaperLookup[match];
    });
}

let lastText: IVNode | null = null;
let flattenIndex: number;
let flattenObject: {
    [key: string]: ChildrenType;
};

function flattenCb(_: object | undefined, child: VirtualNode, key: string|number, childType: number): void {
    if (child === null) {
        lastText = null;
        return;
    }
    if (childType === 3 || childType === 4) {
        if (lastText != null) {
            if (lastText.text) {
                lastText.text += child;
            } else {
                lastText.text = child as string;
            }
            return;
        }
        lastText = child = createVText(child);
    } else {
        lastText = null;
    }
    if (!flattenObject[key]) {
        flattenObject[key] = child;
    } else {
        key = "." + flattenIndex;
        flattenObject[key] = child;
    }
    flattenIndex++;
}

export function fiberizeChildren(children: ChildrenType, fiber: any) {
    flattenObject = {};
    flattenIndex = 0;
    if (children !== undefined) {
        lastText = null; // c 为fiber.props.children
        traverseAllChildren(children, "", flattenCb);
    }
    flattenIndex = 0;
    return (fiber.children = flattenObject);
}

function getComponentKey(component: VirtualNode, index: number) {
    // Do some typechecking here since we call this blindly. We want to ensure
    // that we don't block potential future ES APIs.
    if (
        typeof component === "object" &&
        component !== null &&
        (component as IVNode).key != null
    ) {
        // Explicit key
        return escape((component as IVNode).key as string);
    }
    // Implicit key determined by the index in the set
    return index.toString(36);
}

const SEPARATOR = ".";
const SUBSEPARATOR = ":";

// operateChildren有着复杂的逻辑，如果第一层是可遍历对象，那么
export function traverseAllChildren(children: ChildrenType, nameSoFar: string, callback: typeof flattenCb, bookKeeping?: object|undefined): number {
    let childType: number = typeNumber(children);
    let invokeCallback = false;
    switch (childType) {
        case 0: // undefined
        case 1: // null
        case 2: // boolean
        case 5: // function
        case 6: // symbol
            children = null;
            invokeCallback = true;
            break;
        case 3: // string
        case 4: // number
            invokeCallback = true;
            break;
        // 7 array
        case 8: // object
            if ((children as IVNode).$$typeof || children instanceof Component) {
                invokeCallback = true;
            } else if ((children as IVNode).hasOwnProperty("toString")) {
                children = children + "";
                invokeCallback = true;
                childType = 3;
            }
            break;
    }

    if (invokeCallback) {
        callback(
            bookKeeping,
            children as VirtualNode,
            // If it's the only child, treat the name as if it was wrapped in an array
            // so that it's consistent if the number of children grows.
            nameSoFar === "" ? SEPARATOR + getComponentKey((children as VirtualNode), 0) : nameSoFar,
            childType,
        );
        return 1;
    }

    let subtreeCount = 0; // Count of children found in the current subtree.
    const nextNamePrefix =
        nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
    if ((children as VirtualNodeList).forEach) {
        // 数组，Map, Set
        (children as VirtualNodeList).forEach(function _(child, i) {
            const nextName = nextNamePrefix + getComponentKey((child as VirtualNode), i);
            subtreeCount += traverseAllChildren(
                child,
                nextName,
                callback,
                bookKeeping,
            );
        });
        return subtreeCount;
    }
    const iteratorFn = getIteractor((children as VirtualNodeList));
    if (iteratorFn) {
        const iterator: Iterator<VirtualNode|VirtualNode[]> = iteratorFn.call(children);
        let ii = 0;
        let step: IteratorResult<VirtualNode|VirtualNode[]>;
        while (!(step = iterator.next()).done) {
            const child = step.value;
            const nextName = nextNamePrefix + getComponentKey((child as VirtualNode), ii++);
            subtreeCount += traverseAllChildren(child, nextName, callback, bookKeeping);
        }
        return subtreeCount;
    }
    throw TypeError("children: type is invalid.");
}

const REAL_SYMBOL: symbol = hasSymbol && Symbol.iterator;
const FAKE_SYMBOL: string = "@@iterator";

function getIteractor<T>(a: T[]): (() => Iterator<T>) | void {
    const iter = (REAL_SYMBOL && (a as any)[REAL_SYMBOL]);
    const iteratorFn = iter || (a as any)[FAKE_SYMBOL];
    if (iteratorFn && iteratorFn.call) {
        return iteratorFn;
    }
    return;
}
