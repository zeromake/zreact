import { VNode } from "./vnode";
import { Component } from "./component";
import { IVDom } from "./vdom/index";

/**
 * 通用map<string, any>
 */
export interface IKeyValue {
    [name: string]: any;
}
export interface IBaseProps extends IKeyValue {
    ref?: ((c: any) => void) | IRefObject;
    children?: any[]|any;
    key?: string|number;
}
/**
 * 函数组件
 */
export type funComponent = (props?: IKeyValue, content?: any) => VNode;
/**
 * nodeName的类型
 */
export type childType = VNode|string|number|boolean;

export type ComponentContext = Component<any, any> | Element | Node | HTMLElement | IVDom;

export interface IRefObject {
    value: ComponentContext|null;
}
