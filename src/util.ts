import { global } from "./env";
declare const Promise: any;
declare class Object {
    public static assign: (...args: any[]) => any;
}

const canUsePromise = "Promise" in global;
/**
 * 异步调度方法，异步的执行传入的方法
 */
export let defer: (fn: () => void) => void;
/* istanbul ignore if  */
if (canUsePromise) {
    const promiseDefer = Promise.resolve();
    defer = (fn: () => void) => promiseDefer.then(fn);
} else {
    defer = setTimeout;
}

/**
 * Object.assign的兼容
 */
export const extend = Object.assign || /* istanbul ignore next */ function assign_(t: any) {
    for (let s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (const p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p)) {
                t[p] = s[p];
            }
        }
    }
    return t;
};

export const hasSymbol = typeof Symbol === "function" && (Symbol as any).for;
export const innerHTML = "dangerouslySetInnerHTML";
// export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const REACT_ELEMENT_TYPE: symbol | number = hasSymbol ? (Symbol as any).for("react.element") : 0xeac7;
export const REACT_FRAGMENT_TYPE = hasSymbol ? (Symbol as any).for("react.fragment") : 0xeacb;
export const REACT_PROVIDER_TYPE = hasSymbol ? (Symbol as any).for("react.provider") : 0xeacd;
export const REACT_CONTEXT_TYPE = hasSymbol ? (Symbol as any).for("react.context") : 0xeace;

const toString = Object.prototype.toString;

export function isArray(obj: any): boolean {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return toString.call(obj) === "[object Array]";
}

/**
 * 判断是否为Text节点
 * @param node
 */
export function isTextNode(node: Text | any): boolean {
    return node && node.nodeType === 3;
    // return node.splitText !== undefined;
}

export function rest(s: any, e: string[]): any {
    const t: any = {};
    for (const p_ in s) {
        if (Object.prototype.hasOwnProperty.call(s, p_) && e.indexOf(p_) < 0) {
            t[p_] = s[p_];
        }
    }
    if (s != null && typeof (Object as any).getOwnPropertySymbols === "function") {
        for (let i: number = 0, p_ = (Object as any).getOwnPropertySymbols(s); i < p_.length; i++) {
            if (e.indexOf(p_[i] as any) < 0) {
                t[p_[i]] = s[p_[i]];
            }
        }
    }
    return t;
}
