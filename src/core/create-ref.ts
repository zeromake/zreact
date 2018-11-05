import { IObjectRef } from "./type-shared";

/**
 * 创建一个对象 ref
 */
export function createRef(): IObjectRef {
    return {
        current: null,
    };
}

/**
 * 创建一个穿透的无状态组件
 * @param fn 无状态组件方法
 */
export function forwardRef<T>(fn: T): T {
    (fn as any).isForwardComponent = true;
    return fn;
}
