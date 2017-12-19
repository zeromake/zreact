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
export function findVDom(componentOrDom: any | Node | Element): IVDom | undefined {
    if (componentOrDom) {
        return (componentOrDom as any)._vdom;
    }
}

export function setVDom(componentOrDom: any | Node | Element, vdom: IVDom | undefined): void {
    if (componentOrDom) {
        componentOrDom._vdom = vdom;
    }
}
