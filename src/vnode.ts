import { Component } from "./component";
import { IKeyValue, childType, funComponent } from "./types";

export class VNode {
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    public nodeName: string | typeof Component | funComponent;
    /**
     * 子组件
     */
    public children?: childType[] | null;
    /**
     * 组件所属的属性
     */
    public attributes?: IKeyValue;
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
    constructor(nodeName: string | typeof Component | funComponent, children: childType[] | null) {
        this.nodeName = nodeName;
        this.children = children;
    }
}
