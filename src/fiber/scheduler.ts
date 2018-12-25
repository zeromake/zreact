import {
    typeNumber,
    isFn,
    getWindow,
} from "../core/util";

import {
    IScheduledConfig,
    scheduledCallbackType,
    IScheduledCallbackParams,
    IScheduledOptions,
} from "./type-shared";

const global = getWindow();

const requestAnimationFrameForReact = global.requestAnimationFrame;

const localDate = Date;
const localSetTimeout = setTimeout;
const localClearTimeout = clearTimeout;
const hasNativePerformanceNow =
    typeof performance === "object" && typeof performance.now === "function";

let now: () => number;
if (hasNativePerformanceNow) {
    const Performance = performance;
    now = function _now() {
        return Performance.now();
    };
} else {
    now = function _now() {
        return localDate.now();
    };
}
type cancelScheduledWorkType = (callbackId: IScheduledConfig) => void;
type scheduleWorkType = (callback: scheduledCallbackType, options?: IScheduledOptions) => IScheduledConfig;
let scheduleWork: scheduleWorkType|null = null;
let cancelScheduledWork: cancelScheduledWorkType|null = null;

if (!requestAnimationFrameForReact) {
    const timeoutIds = new Map<scheduledCallbackType, number>();
    scheduleWork = function _(callback: scheduledCallbackType, options?: IScheduledOptions): IScheduledConfig {
        // keeping return type consistent
        const callbackConfig: IScheduledConfig = {
            scheduledCallback: callback,
            timeoutTime: 0,
            next: null,
            prev: null,
        };
        const timeoutId = localSetTimeout(() => {
            callback({
                timeRemaining() {
                    return Infinity;
                },
                didTimeout: false,
            });
        });
        timeoutIds.set(callback, timeoutId);
        return callbackConfig;
    };
    cancelScheduledWork = function _(callbackId: IScheduledConfig): void {
        const callback = callbackId.scheduledCallback;
        const timeoutId = timeoutIds.get(callback);
        timeoutIds.delete(callback);
        localClearTimeout(timeoutId);
    };
} else {
    let headOfPendingCallbacksLinkedList: IScheduledConfig|null = null;
    let tailOfPendingCallbacksLinkedList: IScheduledConfig|null = null;

    // We track what the next soonest timeoutTime is, to be able to quickly tell
    // if none of the scheduled callbacks have timed out.
    let nextSoonestTimeoutTime = -1;

    let isIdleScheduled = false;
    let isAnimationFrameScheduled = false;

    let frameDeadline = 0;
    // We start out assuming that we run at 30fps but then the heuristic tracking
    // will adjust this value to a faster fps if we get more frequent animation
    // frames.
    let previousFrameTime = 33;
    let activeFrameTime = 33;

    const frameDeadlineObject: IScheduledCallbackParams = {
        timeRemaining() {
            const remaining = frameDeadline - now();
            return remaining > 0 ? remaining : 0;
        },
        didTimeout: false,
    };

    /**
     * Handles the case where a callback errors:
     * - don't catch the error, because this changes debugging behavior
     * - do start a new postMessage callback, to call any remaining callbacks,
     * - but only if there is an error, so there is not extra overhead.
     */
    const callUnsafely = function _callUnsafely(callbackConfig: IScheduledConfig, arg: IScheduledCallbackParams) {
        const callback = callbackConfig.scheduledCallback;
        let finishedCalling = false;
        try {
            callback(arg);
            finishedCalling = true;
        } finally {
            // always remove it from linked list
            (cancelScheduledWork as cancelScheduledWorkType)(callbackConfig);

            if (!finishedCalling) {
                // an error must have been thrown
                isIdleScheduled = true;
                global.postMessage(messageKey, "*");
            }
        }
    };

    /**
     * Checks for timed out callbacks, runs them, and then checks again to see if
     * any more have timed out.
     * Keeps doing this until there are none which have currently timed out.
     */
    const callTimedOutCallbacks = function _callTimedOutCallbacks() {
        if (headOfPendingCallbacksLinkedList === null) {
            return;
        }

        const currentTime = now();
        // TODO: this would be more efficient if deferred callbacks are stored in
        // min heap.
        // Or in a linked list with links for both timeoutTime order and insertion
        // order.
        // For now an easy compromise is the current approach:
        // Keep a pointer to the soonest timeoutTime, and check that first.
        // If it has not expired, we can skip traversing the whole list.
        // If it has expired, then we step through all the callbacks.
        if (nextSoonestTimeoutTime === -1 || nextSoonestTimeoutTime > currentTime) {
            // We know that none of them have timed out yet.
            return;
        }
        // NOTE: we intentionally wait to update the nextSoonestTimeoutTime until
        // after successfully calling any timed out callbacks.
        // If a timed out callback throws an error, we could get stuck in a state
        // where the nextSoonestTimeoutTime was set wrong.
        let updatedNextSoonestTimeoutTime = -1; // we will update nextSoonestTimeoutTime below
        const timedOutCallbacks = [];

        // iterate once to find timed out callbacks and find nextSoonestTimeoutTime
        let currentCallbackConfig: IScheduledConfig|null = headOfPendingCallbacksLinkedList;
        while (currentCallbackConfig !== null) {
            const timeoutTime = currentCallbackConfig.timeoutTime;
            if (timeoutTime !== -1 && timeoutTime <= currentTime) {
                // it has timed out!
                timedOutCallbacks.push(currentCallbackConfig);
            } else {
                if (
                    timeoutTime !== -1 &&
                    (updatedNextSoonestTimeoutTime === -1 ||
                        timeoutTime < updatedNextSoonestTimeoutTime)
                ) {
                    updatedNextSoonestTimeoutTime = timeoutTime;
                }
            }
            currentCallbackConfig = currentCallbackConfig!.next;
        }

        if (timedOutCallbacks.length > 0) {
            frameDeadlineObject.didTimeout = true;
            for (let i = 0, len = timedOutCallbacks.length; i < len; i++) {
                callUnsafely(timedOutCallbacks[i], frameDeadlineObject);
            }
        }

        // NOTE: we intentionally wait to update the nextSoonestTimeoutTime until
        // after successfully calling any timed out callbacks.
        nextSoonestTimeoutTime = updatedNextSoonestTimeoutTime;
    };

    // We use the postMessage trick to defer idle work until after the repaint.
    const messageKey = `__reactIdleCallback$${Math.random().toString(36).slice(2)}`;
    const idleTick = function _idleTick(event: MessageEvent) {
        if (event.source !== global || event.data !== messageKey) {
            return;
        }
        isIdleScheduled = false;

        if (headOfPendingCallbacksLinkedList === null) {
            return;
        }

        // First call anything which has timed out, until we have caught up.
        callTimedOutCallbacks();

        let currentTime = now();
        // Next, as long as we have idle time, try calling more callbacks.
        while (
            frameDeadline - currentTime > 0 &&
            headOfPendingCallbacksLinkedList !== null
        ) {
            const latestCallbackConfig = headOfPendingCallbacksLinkedList;
            frameDeadlineObject.didTimeout = false;
            // callUnsafely will remove it from the head of the linked list
            callUnsafely(latestCallbackConfig, frameDeadlineObject);
            currentTime = now();
        }
        if (headOfPendingCallbacksLinkedList !== null) {
            if (!isAnimationFrameScheduled) {
                // Schedule another animation callback so we retry later.
                isAnimationFrameScheduled = true;
                requestAnimationFrameForReact(animationTick);
            }
        }
    };
    // Assumes that we have addEventListener in this environment. Might need
    // something better for old IE.
    global.addEventListener("message", idleTick, false);

    const animationTick = function _animationTick(rafTime: number): void {
        isAnimationFrameScheduled = false;
        let nextFrameTime = rafTime - frameDeadline + activeFrameTime;
        if (
            nextFrameTime < activeFrameTime &&
            previousFrameTime < activeFrameTime
        ) {
            if (nextFrameTime < 8) {
                // Defensive coding. We don't support higher frame rates than 120hz.
                // If we get lower than that, it is probably a bug.
                nextFrameTime = 8;
            }
            // If one frame goes long, then the next one can be short to catch up.
            // If two frames are short in a row, then that's an indication that we
            // actually have a higher frame rate than what we're currently optimizing.
            // We adjust our heuristic dynamically accordingly. For example, if we're
            // running on 120hz display or 90hz VR display.
            // Take the max of the two in case one of them was an anomaly due to
            // missed frame deadlines.
            activeFrameTime =
                nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
        } else {
            previousFrameTime = nextFrameTime;
        }
        frameDeadline = rafTime + activeFrameTime;
        if (!isIdleScheduled) {
            isIdleScheduled = true;
            global.postMessage(messageKey, "*");
        }
    };

    scheduleWork = function _scheduleWork(callback: scheduledCallbackType, options?: IScheduledOptions) {
        let timeoutTime = -1;
        if (options != null && typeof options.timeout === "number") {
            timeoutTime = now() + options.timeout;
        }
        if (
            nextSoonestTimeoutTime === -1 ||
            (timeoutTime !== -1 && timeoutTime < nextSoonestTimeoutTime)
        ) {
            nextSoonestTimeoutTime = timeoutTime;
        }

        const scheduledCallbackConfig: IScheduledConfig = {
            scheduledCallback: callback,
            timeoutTime,
            prev: null,
            next: null,
        };
        if (headOfPendingCallbacksLinkedList === null) {
            // Make this callback the head and tail of our list
            headOfPendingCallbacksLinkedList = scheduledCallbackConfig;
            tailOfPendingCallbacksLinkedList = scheduledCallbackConfig;
        } else {
            // Add latest callback as the new tail of the list
            scheduledCallbackConfig.prev = tailOfPendingCallbacksLinkedList;
            // renaming for clarity
            const oldTailOfPendingCallbacksLinkedList = tailOfPendingCallbacksLinkedList;
            if (oldTailOfPendingCallbacksLinkedList !== null) {
                oldTailOfPendingCallbacksLinkedList.next = scheduledCallbackConfig;
            }
            tailOfPendingCallbacksLinkedList = scheduledCallbackConfig;
        }

        if (!isAnimationFrameScheduled) {
            // If rAF didn't already schedule one, we need to schedule a frame.
            // TODO: If this rAF doesn't materialize because the browser throttles, we
            // might want to still have setTimeout trigger scheduleWork as a backup to ensure
            // that we keep performing work.
            isAnimationFrameScheduled = true;
            requestAnimationFrameForReact(animationTick);
        }
        return scheduledCallbackConfig;
    };

    cancelScheduledWork = function _cancelScheduledWork(callbackConfig: IScheduledConfig) {
        if (
            callbackConfig.prev === null &&
            headOfPendingCallbacksLinkedList !== callbackConfig
        ) {
            // this callbackConfig has already been cancelled.
            // cancelScheduledWork should be idempotent, a no-op after first call.
            return;
        }

        /**
         * There are four possible cases:
         * - Head/nodeToRemove/Tail -> null
         *   In this case we set Head and Tail to null.
         * - Head -> ... middle nodes... -> Tail/nodeToRemove
         *   In this case we point the middle.next to null and put middle as the new
         *   Tail.
         * - Head/nodeToRemove -> ...middle nodes... -> Tail
         *   In this case we point the middle.prev at null and move the Head to
         *   middle.
         * - Head -> ... ?some nodes ... -> nodeToRemove -> ... ?some nodes ... -> Tail
         *   In this case we point the Head.next to the Tail and the Tail.prev to
         *   the Head.
         */
        const next = callbackConfig.next;
        const prev = callbackConfig.prev;
        callbackConfig.next = null;
        callbackConfig.prev = null;
        if (next !== null) {
            // we have a next

            if (prev !== null) {
                // we have a prev

                // callbackConfig is somewhere in the middle of a list of 3 or more nodes.
                prev.next = next;
                next.prev = prev;
                return;
            } else {
                // there is a next but not a previous one;
                // callbackConfig is the head of a list of 2 or more other nodes.
                next.prev = null;
                headOfPendingCallbacksLinkedList = next;
                return;
            }
        } else {
            // there is no next callback config; this must the tail of the list

            if (prev !== null) {
                // we have a prev

                // callbackConfig is the tail of a list of 2 or more other nodes.
                prev.next = null;
                tailOfPendingCallbacksLinkedList = prev;
                return;
            } else {
                // there is no previous callback config;
                // callbackConfig is the only thing in the linked list,
                // so both head and tail point to it.
                headOfPendingCallbacksLinkedList = null;
                tailOfPendingCallbacksLinkedList = null;
                return;
            }
        }
    };
}
export {
    now,
    scheduleWork,
    cancelScheduledWork,
};
