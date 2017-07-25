declare const Promise: any;
declare class Object {
    public static assign: (...args: any[]) => any;
}

/**
 * 异步调度方法，异步的执行传入的方法
 */
export let defer: (fn: () => void) => void;
if (typeof Promise === "function") {
    const promiseDefer = Promise.resolve();
    defer = (fn: () => void) => promiseDefer.then(fn);
} else {
    defer = setTimeout;
}

/**
 * Object.assign的兼容
 */
export const extend = Object.assign || function assign_(t: any) {
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
