import { IVDom } from "./vdom/index";

/**
 * 获取组件|vdom的dom对象
 * @param componentOrVdom 
 */
export function findDOMNode(componentOrVdom: any): Element {
    return componentOrVdom && componentOrVdom.base;
}

/**
 * 获取组件或|dom的vdom对象
 */
export function findVDom(componentOrDom: any | Node | Element): IVDom {
    return (componentOrDom as any)._vdom
}