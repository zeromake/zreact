import { Component } from "./component";
import { IKeyValue } from "./types";

/**
 * 虚拟的Node，与VDom不同，用于生成真实的dom
 */
export interface IVNode {
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    nodeName: string | typeof Component;
    /**
     * 子组件
     */
    children: Array<string|number|boolean|IVNode>;
    /**
     * 组件所属的属性
     */
    attributes?: IKeyValue;
    /**
     * 属性中的key
     */
    key?: string|number;
}
