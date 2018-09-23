import { IBaseProps, IBaseObject, IComponentClass, IComponentMinx, VirtualNodeList, VirtualNode, VNodeType, IRefType, IVNode } from "./type-shared";
import { hasOwnProperty, extend, REACT_ELEMENT_TYPE } from "./util";
import { Renderer } from "./create-renderer";

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
    if (typeof type === "function" && (type as IComponentClass<IBaseProps, IBaseObject>).defaultProps != null) {
        const defaultProps: IBaseObject = (type as IComponentClass<IBaseProps, IBaseObject>).defaultProps;
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
    let ref: IRefType|null = null;
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
    let props = typeof element.props === "string" ? element.props : {...element.props};
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

function ReactElement(type: VNodeType, tag: number, props: IBaseProps | string, key?: string | null, ref?: IRefType | null, owner?: IVNode): IVNode {
    const vnode: IVNode = {
        type,
        tag,
        props,
    };
    if (tag !== 6) {
        vnode.$$typeof = REACT_ELEMENT_TYPE;
        vnode.ref = ref;
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

export function createVText(text) {
    return ReactElement("#text", 6, text + "");
}
