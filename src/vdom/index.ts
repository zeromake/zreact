import { VNode } from "../vnode";
import { Component } from "../component";
import { isTextNode } from "../dom/index";
import { ATTR_KEY } from "../constants";

export function isSameNodeType(node: any, vnode: VNode, hydrating: boolean) {
    if (typeof vnode === "string" || typeof vnode === "number") {
        return isTextNode(node.base);
    }
    if (typeof vnode.nodeName === "string") {
        return !node._componentConstructor && isNamedNode(node.base, vnode.nodeName);
    }
    return hydrating || node._componentConstructor === vnode.nodeName;
}

/** Check if an Element has a given normalized name.
 * @param {Element} node
 * @param {String} nodeName
 */
export function isNamedNode(
    node: { normalizedNodeName: string, nodeName: string },
    nodeName: string,
) {
    return node.normalizedNodeName === nodeName
        || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

export function getNodeProps(vnode: VNode) {
    const props = { ...vnode.attributes };
    props.children = vnode.children;
    const nodeName: any = vnode.nodeName;
    const defaultProps = nodeName.defaultProps;
    if (defaultProps !== undefined) {
        for (const i in defaultProps) {
            if (props[i] === undefined) {
                props[i] = defaultProps[i];
            }
        }
    }
    return props;
}

interface IKeyValue {
    [name: string]: any;
}
interface IEventFunList {
    [name: string]: Array<(e: Event) => void>;
}

/**
 * 真正dom绑定的一些数据
 * @constructor
 */
export class VDom {
    /**
     * dom所属的顶级Component
     */
    public component?: Component;
    /**
     * 子组件
     */
    public children?: VDom[];
    /**
     * 真实dom索引
     */
    public base?: Element;
    /**
     * 每种事件的代理方法存放点, 真实绑定到dom上的方法。
     */
    public eventProxy?: { [name: string]: (e: Event) => void };
    /**
     * dom所属的props
     */
    public props?: IKeyValue;
    /**
     * 通过props设置的事件方法, 通过eventProxy来调用, 保证在不停的props变化时不会一直绑定与解绑。
     */
    public listeners?: IEventFunList;
    /**
     * domb标签名
     */
    public normalizedNodeName?: string;
}
