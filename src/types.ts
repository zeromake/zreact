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
export type funComponent = (props?: IBaseProps, content?: any) => childType;
/**
 * nodeName的类型
 */
export type childType = VNode|string|number|boolean|null|undefined|void;

export type ComponentContext = Component<any, any> | Element | Node | HTMLElement | IVDom;

export interface IRefObject {
    value: ComponentContext|null;
}

export interface IBaseVNode {
    $$typeof: any;
}

export interface IReactContext<T> extends IBaseVNode {
    calculateChangedBits: ((a: T, b: T) => number) | null;
    defaultValue: T;
    currentValue: T;
    changedBits: number;
    ConsumerChildren: any[];
    Provider: IReactProvider<T>;
    Consumer: IReactContext<T>;
}
export interface IReactProvider<T> extends IBaseVNode {
    $$typeof: any;
    context: IReactContext<T>;
}

export type NodeName = string | typeof Component | funComponent | IReactContext<any> | IReactProvider<any>;
