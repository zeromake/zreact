import { Component } from "./component";
import { IKeyValue } from "./types";

/**
 * 虚拟的Node，与VDom不同，用于生成真实的dom
 */
export class VNode {
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    public nodeName: string | typeof Component | ((props?: IKeyValue, state?: IKeyValue, context?: IKeyValue) => VNode);
    /**
     * 子组件
     */
    public children: Array<string|number|boolean|VNode>;
    /**
     * 组件所属的属性
     */
    public attributes?: IKeyValue;
    /**
     * 属性中的key
     */
    public key?: any;
}
