import { VNode } from "./vnode";

/**
 * 通用map<string, any>
 */
export interface IKeyValue {
    [name: string]: any;
}
/**
 * 函数组件
 */
export type funComponent = (props?: IKeyValue, content?: any) => VNode;
/**
 * nodeName的类型
 */
export type childType = VNode|string|number|boolean;
