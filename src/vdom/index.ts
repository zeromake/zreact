import { VNode } from "../vnode";
import { Component } from "../component";
import { isTextNode } from "../dom/index";
// import { ATTR_KEY } from "../constants";
import { extend } from "../util";
import { IKeyValue } from "../types";

/**
 * dom节点与vnode是否相同的标签
 * @param node
 * @param vnode
 * @param hydrating
 */
export function isSameNodeType(node: IVDom, vnode: string|number|boolean|VNode, hydrating: boolean) {
    if (typeof vnode === "string" || typeof vnode === "number" || typeof vnode === "boolean") {
        // vnode是文本节点,判断dom是否为文本节点
        return isTextNode(node.base);
    }
    if (typeof vnode.nodeName === "string") {
        // vnode是原生组件,判断dom非组件的根节点且标签名相同
        return !node.componentConstructor && isNamedNode(node, vnode.nodeName);
    }
    return hydrating || node.componentConstructor === vnode.nodeName;
}

/** 判断标签名是否相同.
 * @param {Element} node
 * @param {String} nodeName
 */
export function isNamedNode(
    node: IVDom,
    nodeName: string,
) {
    return node.normalizedNodeName === nodeName
        || (node.base && node.base.nodeName.toLowerCase() === nodeName.toLowerCase());
}

/**
 * 获取当前组件所有地方来的props
 * @param vnode
 */
export function getNodeProps(vnode: VNode) {
    // jsx上的属性
    const props = extend({}, vnode.attributes);
    props.children = vnode.children;
    // 组件类
    const nodeName: any = vnode.nodeName;
    // 组件默认props
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

export interface IEventFun {
    [name: string]: (e: Event) => void;
}

/**
 * 真正dom绑定的一些数据
 * @constructor
 */
export interface IVDom {
    /**
     * dom所属的顶级Component
     */
    component?: Component<IKeyValue, IKeyValue>;
    /**
     * 真实dom索引
     */
    base: Element| Text | Node;
    /**
     * 每种事件的代理方法存放点, 真实绑定到dom上的方法。
     */
    eventProxy?: { [name: string]: ((e: Event) => void) | undefined };
    /**
     * dom所属的props
     */
    props?: IKeyValue | boolean;
    /**
     * 通过props设置的事件方法, 通过eventProxy来调用, 保证在不停的props变化时不会一直绑定与解绑。
     */
    listeners?: IEventFun;
    /**
     * dom标签名
     */
    normalizedNodeName?: string;
    /**
     * component类(原型)
     */
    componentConstructor?: any;
    // constructor(base: Element| Text | Node) {
    //     this.base = base;
    // }
    // public clear() {
    //     this.children = undefined;
    //     this.component = undefined;
    //     this.eventProxy = undefined;
    //     this.listeners = undefined;
    //     this.normalizedNodeName = undefined;
    //     this.props = undefined;
    //     this.componentConstructor = undefined;
    // }
}

export function buildVDom(base?: Element|Text|Node): IVDom | undefined {
    if (base) {
        const vdom = {
            base,
        };
        try {
            (base as any)._vdom = vdom;
        } catch (e) {
        }
        return vdom;
    }
}
