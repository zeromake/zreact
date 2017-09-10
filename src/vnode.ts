import { Component } from "./component";
import { IKeyValue, childType, funComponent } from "./types";

export class VNode {
    /**
     * 组件名
     * {string} 为原生组件
     * {Component|function} 为自定义组件
     */
    nodeName: string | typeof Component | funComponent;
    /**
     * 子组件
     */
    children: childType[];
    /**
     * 组件所属的属性
     */
    attributes?: IKeyValue;
    /**
     * 属性中的key
     */
    key?: string|number;

    /**
     * 绑定的组件实例
     */
    component?: Component<IKeyValue, IKeyValue> | undefined | void | null;
    constructor(nodeName: string | typeof Component | funComponent, children: childType[]) {
        this.nodeName = nodeName;
        this.children = children;
    }
}
