declare const Promise: any;
declare class Object {
    public static assign: (...args: any[]) => any;
}

export let defer: (fn: () => void) => void;
if (typeof Promise === "function") {
    const promiseDefer = Promise.resolve();
    defer = (fn: () => void) => promiseDefer.then(fn);
} else {
    defer = setTimeout;
}

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
