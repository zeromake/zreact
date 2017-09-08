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

// declare function requestIdleCallback(fun: () => void): void;

// declare const window: {
//     addEventListener: any;
//     postMessage: any;
// };

// let rAF;
// let rIC;
// let scheduledRAFCallback: any = null;
// let scheduledRICCallback: any = null;

// let isIdleScheduled = false;
// let isAnimationFrameScheduled = false;

// let frameDeadline = 0;
// let previousFrameTime = 33;
// let activeFrameTime = 33;

// const frameDeadlineObject = {
//     timeRemaining: typeof performance === "object" && typeof performance.now === "function" ? function _() {
//     return frameDeadline - performance.now();
//     } : function _() {
//         return frameDeadline - Date.now();
//     },
// };
// const messageKey = "__reactIdleCallback$" + Math.random().toString(36).slice(2);
// const idleTick = function _(event: any) {
//     if (event.source !== window || event.data !== messageKey) {
//     return;
//     }
//     isIdleScheduled = false;
//     const callback = scheduledRICCallback;
//     scheduledRICCallback = null;
//     if (callback) {
//         callback(frameDeadlineObject);
//     }
// };
// window.addEventListener("message", idleTick, false);

// const animationTick = function _(rafTime: number) {
//     isAnimationFrameScheduled = false;
//     let nextFrameTime = rafTime - frameDeadline + activeFrameTime;
//     if (nextFrameTime < activeFrameTime && previousFrameTime < activeFrameTime) {
//     if (nextFrameTime < 8) {
//         nextFrameTime = 8;
//     }
//     activeFrameTime = nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
//     } else {
//         previousFrameTime = nextFrameTime;
//     }
//     frameDeadline = rafTime + activeFrameTime;
//     if (!isIdleScheduled) {
//         isIdleScheduled = true;
//         window.postMessage(messageKey, "*");
//     }
//     const callback = scheduledRAFCallback;
//     scheduledRAFCallback = null;
//     if (callback) {
//         callback(rafTime);
//     }
// };

// rAF = function _(callback: any) {
//     scheduledRAFCallback = callback;
//     if (!isAnimationFrameScheduled) {
//         isAnimationFrameScheduled = true;
//         requestAnimationFrame(animationTick);
//     }
//     return 0;
// };

// rIC = function _(callback: any) {
//     scheduledRICCallback = callback;
//     if (!isAnimationFrameScheduled) {
//         isAnimationFrameScheduled = true;
//         requestAnimationFrame(animationTick);
//     }
//     return 0;
// };
// export const Scheduling = {
//     rAF,
//     rIC,
// };
