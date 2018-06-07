import { IBaseProps, IBaseObject, IComponentClass, IComponentMinx, VirtualNodeList, VirtualNode, VNodeType, IRefType } from "./type-shared";
import { hasOwnProperty, extend } from "./util";

const RESERVED_PROPS = {
    key: true,
    ref: true,
};

function makeProps(type: VNodeType, config: IBaseProps, children: VirtualNodeList, len: number): IBaseProps {
    const props: IBaseProps = {};
    for (const propName in config) {
        if (hasOwnProperty.call(config, propName) && !hasOwnProperty.call(RESERVED_PROPS, propName)) {
            props[propName] = config[propName];
        }
    }
    if (type && (type as any).defaultProps) {
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

export function createElement(type: VNodeType, config: IBaseProps|null, ...children: VirtualNodeList) {
    let tag: number = 5;
    let key: string|null = null;
    let ref: IRefType|null = null;
    const argsLen = children.length;
    if (type && (type as IComponentClass<any, any>).call) {
        tag = ((type as IComponentClass<any, any>).prototype as IComponentMinx<any, any>).render ? 1 : 2;
    }
    if (config != null) {
        if (hasValidRef(config)) {
            ref = config.ref;
        }
        if (hasVaildKey(config)) {
            key = config.key + "";
        }
    }
}
