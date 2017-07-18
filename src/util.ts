declare const Promise: any;

export let defer: (fn: () => void) => void;
if (typeof Promise === "function") {
    const promiseDefer = Promise.resolve();
    defer = (fn: () => void) => promiseDefer.then(fn);
} else {
    defer = setTimeout;
}

export function extend(obj: any, props: any) {
    for (const i in props) {
        obj[i] = props[i];
    }
    return obj;
}
