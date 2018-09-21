import { Component } from "./component";
import { IKeyValue, NodeName, IBaseVNode, IBaseProps } from "./types";

import {
    REACT_ELEMENT_TYPE,
} from "./util";

export class VNode implements IBaseVNode {
    public $$typeof: symbol | number;
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    public type: NodeName;
    /**
     * 组件所属的属性
     */
    public props: IBaseProps;
    /**
     * 属性中的key
     */
    public key?: string|number;

    /**
     * 绑定的组件实例
     */
    public component?: Component<IBaseProps, IKeyValue> | undefined | void | null;
    public zreactCompatUpgraded?: boolean;
    public zreactCompatNormalized?: boolean;

    constructor(nodeName: NodeName, props: IBaseProps) {
        this.type = nodeName;
        this.props = props;
        this.key = props.key;
        this.$$typeof = REACT_ELEMENT_TYPE;
    }
}
