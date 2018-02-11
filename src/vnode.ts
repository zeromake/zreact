import { Component } from "./component";
import { IKeyValue, childType, funComponent, NodeName, IBaseVNode } from "./types";

export class VNode implements IBaseVNode {
    public $$typeof: any;
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    public nodeName: NodeName;
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    public type: NodeName;
    /**
     * 子组件
     */
    public children?: childType[] | childType | null;
    /**
     * 组件所属的属性
     */
    public attributes?: IKeyValue;
    /**
     * 组件所属的属性
     */
    public props?: IKeyValue;
    /**
     * 属性中的key
     */
    public key?: string|number;

    /**
     * 绑定的组件实例
     */
    public component?: Component<IKeyValue, IKeyValue> | undefined | void | null;
    public zreactCompatUpgraded?: boolean;
    public zreactCompatNormalized?: boolean;
    constructor(nodeName: NodeName, children: childType[] | childType | null, vtype: any) {
        this.nodeName = nodeName;
        this.type = nodeName;
        this.children = children;
        this.$$typeof = vtype;
    }
}
