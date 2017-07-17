declare const Promise: any;

const promiseDefer = Promise.resolve();

export const defer = typeof Promise === "function"
    ? (fn: () => void) => promiseDefer.then(fn)
    : setTimeout;

export function extend(obj: any, props: any) {
    for (const i in props) {
        obj[i] = props[i];
    }
    return obj;
}
