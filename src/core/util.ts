import { IUpdater, IBaseObject, IComponentMinx, IOwnerAttribute } from "./type-shared";
import { IFiber } from "../fiber/type-shared";

export const arrayPush = Array.prototype.push;
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasSymbol = typeof Symbol === "function" && (Symbol as any).for;
export const gSBU = "getSnapshotBeforeUpdate";
export const gDSFP = "getDerivedStateFromProps";
export const effects: IFiber[] = [];
export const topFibers: IFiber[] = [];
export const topNodes = [];
export const emptyObject = {};

/**
 * react 的组件 symbol
 */
export const REACT_ELEMENT_TYPE: number | symbol = hasSymbol ? (Symbol as any).for("react.element") : 0xeac7;

export function noop(...args: any[]): any {}

export function returnFalse(): boolean {
    return false;
}

export function returnTrue(): boolean {
    return true;
}

export function extend<T, F>(target: T, ...props: F[]): T & F {
    for (const prop of props) {
        for (const key in prop) {
            if (hasOwnProperty.call(prop, key)) {
                (target as any)[key] = prop[key];
            }
        }
    }
    return target as any;
}

export function resetStack(info: IFiber) {
    keepLast(info.containerStack as any[]);
    keepLast(info.contextStack as any[]);
}

function keepLast(list: any[]) {
    const len = list.length;
    list.splice(0, len - 1);
}

const numberMap: IBaseObject = {
    // null undefined IE6-8这里会返回[object Object]
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7,
};

export let __TYPE = Object.prototype.toString;

/**
 * 判断数据类型
 * @param data
 */
export function typeNumber(data: any): number {
    if (data === null) {
        return 1;
    }
    if (data === undefined) {
        return 0;
    }
    const a = numberMap[__TYPE.call(data)];
    return a || 8;
}

export const fakeUpdater: IUpdater = {
    mountOrder: 0,
    enqueueSetState: returnFalse,
    isMounted: returnFalse,
};

/**
 * 组件是否挂载
 * @param instance 组件对象
 */
export function isMounted(instance: IComponentMinx<any, any> | IOwnerAttribute) {
    const fiber = instance.$reactInternalFiber;
    return !!(fiber && fiber.hasMounted);
}
const fakeWindow = {};
export function getWindow(): Window {
    try {
        if (window) {
            return window;
        }
    /* istanbul ignore next  */
    } catch (e) {/*kill*/}
    try {
        if (global) {
            return global as any;
        }
    /* istanbul ignore next  */
    } catch (e) {/*kill*/}
    return fakeWindow as any;
}
export const ObjectToString = Object.prototype.toString;
export function isFn(obj: any): boolean {
    return ObjectToString.call(obj) === "[object Function]";
}