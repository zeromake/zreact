import { document, modern, contains } from "./browser";
import { isFn, noop, toLowerCase } from "zreact-core/util";
import { Renderer } from "zreact-core/create-renderer";
import { enqueueDuplex, IDuplexElement } from "./duplex";
import { IFiber } from "zreact-fiber/type-shared";

export const rform = /textarea|input|select|option/i;
const globalEvents: {
    [name: string]: boolean;
} = {};
export const eventPropHooks: {
    [name: string]: (e: Event|ISyntheticEvent) => any;
} = {}; // 用于在事件回调里对事件对象进行
export const eventHooks: {
    [name: string]: (dom: Element, type?: string) => any;
} = {}; // 用于在元素上绑定特定的事件
// 根据onXXX得到其全小写的事件名, onClick --> click, onClickCapture --> click,
// onMouseMove --> mousemove
const eventLowerCache: {[name: string]: string} = {
    onClick: "click",
    onChange: "change",
    onWheel: "wheel",
};

export function eventAction(dom: IDuplexElement, name: string, val: boolean|((e: Event) => void), lastProps: {[name: string]: boolean}, fiber: IFiber) {
    const events = dom.$events || (dom.$events = {});
    events.vnode = fiber;
    const refName = toLowerCase(name.slice(2));
    if (val === false) {
        delete events[refName];
    } else {
        if (!lastProps[name]) {
            // 添加全局监听事件
            const eventName = getBrowserName(name);
            const hook = eventHooks[eventName];
            if (hook) {
                hook(dom, eventName);
            }
            addGlobalEvent(eventName);
        }
        // onClick --> click, onClickCapture --> clickcapture
        events[refName] = val;
    }
}

const isTouch = "ontouchstart" in document;

export function dispatchEvent(event: Event, type?: string, endpoint?: Element): void {
    // __type__ 在injectTapEventPlugin里用到
    const e: ISyntheticEvent = new (SyntheticEvent as any)(event);
    if (type) {
        e.type = type;
    }
    const bubble = e.type;
    const terminal = endpoint || document;
    const hook = eventPropHooks[e.type];
    if (hook && false === hook(e)) {
        return;
    }

    Renderer.batchedUpdates!(function _() {
        const paths = collectPaths(e.target as Element, terminal, {});
        const captured = bubble + "capture";
        triggerEventFlow(paths, captured, e);

        if (!e.$stopPropagation) {
            triggerEventFlow(paths.reverse(), bubble, e);
        }
    }, e);
}

function triggerEventFlow(paths: IPathType[], prop: string, e: ISyntheticEvent) {
    for (let i = paths.length; i--; ) {
        const path = paths[i];
        const fn = path.events[prop];
        if (isFn(fn)) {
            e.currentTarget = path.node as Element;
            fn.call(void 0, e);
            if (e.$stopPropagation) {
                break;
            }
        }
    }
}

let nodeID = 1;
interface IPathType {
    node: IDuplexElement;
    events: {
        [name: string]: any,
        vnode?: IFiber,
    };
}
interface IUniqueType {
    [uid: number]: number;
}
function collectPaths(begin: IDuplexElement, end: Element|Document, unique: IUniqueType) {
    const paths: IPathType[] = [];
    let node = begin;
    // 先判定路径上有绑定事件没有
    while (node && node.nodeType === 1) {
        const checkChange = node;
        if (node.$events) {
            let vnode = node.$events.vnode!;
            inner: while (vnode.return) {
                // ReactDOM.render有Unbatch, container,
                // ReactDOM.createPortal有AnuPortal
                if (vnode.tag === 5) {
                    node = vnode.stateNode as IDuplexElement;
                    if (node === end) {
                        return paths;
                    }
                    if (!node) {
                        break inner;
                    }
                    const uid = node.uniqueID || (node.uniqueID = ++nodeID);
                    if (node.$events && !unique[uid]) {
                        unique[uid] = 1;
                        paths.push({ node, events: node.$events });
                    }
                }
                vnode = vnode.return;
            }
        }
        if (node === checkChange) {
            node = node.parentNode as IDuplexElement;
        }
    }
    return paths;
}

/**
 * 添加事件到全局
 * @param name 事件名
 * @param capture 是否冒泡
 */
export function addGlobalEvent(name: string, capture?: boolean) {
    if (!globalEvents[name]) {
        globalEvents[name] = true;
        addEvent(document, name, dispatchEvent, capture);
    }
}
/**
 * 统一添加事件方法
 * @param el dom对象
 * @param type 事件名
 * @param fn 绑定的事件方法
 * @param capture 是否冒泡
 */
export function addEvent(el: HTMLDocument|Element, type: string, fn: ((e: Event) => void)|((e: ISyntheticEvent) => void), capture?: boolean) {
    if (el.addEventListener) {
        el.addEventListener(type, fn as any, capture || false);
    } else if ((el as any).attachEvent) {
        (el as any).attachEvent("on" + type, fn);
    }
}

const rcapture = /Capture$/;
export function getBrowserName(eventName: string): string {
    let lower = eventLowerCache[eventName];
    if (lower) {
        return lower;
    }
    const camel = eventName.slice(2).replace(rcapture, "");
    lower = camel.toLowerCase();
    eventLowerCache[eventName] = lower;
    return lower;
}

interface ISyntheticEvent extends Event {
    type: string;
    relatedTarget?: Element;
    currentTarget: Element;
    target: Element;
    timeStamp: number;
    nativeEvent: Event;
    $stopPropagation?: boolean;
    stopImmediate?: boolean;
    defaultPrevented: boolean;
    deltaX?: number;
    deltaY?: number;
    wheelDeltaX?: number;
    wheelDeltaY?: number;
    wheelDelta?: number;
    fixEvent(): void;
    fixHooks(): void;
    persist(): void;
    preventDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}

export function SyntheticEvent(this: ISyntheticEvent, event: Event) {
    if ((event as any).nativeEvent) {
        return event;
    }
    for (const i in event) {
        if (!(eventProto as any)[i]) {
            (this as any)[i] = (event as any)[i];
        }
    }
    if (!this.target) {
        this.target = event.srcElement!;
    }
    this.fixEvent();
    this.timeStamp = new Date().getTime();
    this.nativeEvent = event;
}

const eventProto = (SyntheticEvent.prototype = {
    fixEvent: noop, // 留给以后扩展用
    fixHooks: noop,
    persist: noop,
    preventDefault(this: ISyntheticEvent) {
        const e = this.nativeEvent || {} as Event;
        e.returnValue = this.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
            this.defaultPrevented = e.defaultPrevented;
        }
    },
    stopPropagation(this: ISyntheticEvent): void {
        const e = this.nativeEvent || {} as Event;
        e.cancelBubble = this.$stopPropagation = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation(this: ISyntheticEvent): void {
        this.stopPropagation();
        this.stopImmediate = true;
    },
    toString(): string {
        return "[object Event]";
    },
});

/**
 * DOM通过event对象的relatedTarget属性提供了相关元素的信息。这个属性只对于mouseover和mouseout事件才包含值；
 * 对于其他事件，这个属性的值是null。IE不支持realtedTarget属性，但提供了保存着同样信息的不同属性。
 * 在mouseover事件触发时，IE的fromElement属性中保存了相关元素；
 * 在mouseout事件出发时，IE的toElement属性中保存着相关元素。
 * 但fromElement与toElement可能同时都有值
 */
function getRelatedTarget(e: ISyntheticEvent) {
    if (!e.timeStamp) {
        e.relatedTarget = e.type === "mouseover" ? (e as any).fromElement : (e as any).toElement;
    }
    return e.relatedTarget;
}
function getTarget(e: ISyntheticEvent): IDuplexElement {
    return e.target || e.srcElement;
}
["load", "error"].forEach(function _(name: string) {
    eventHooks[name] = function __(dom: Element, type?: string) {
        const mark = "$$" + type;
        if (!(dom as any)[mark]) {
            (dom as any)[mark] = true;
            addEvent(dom, type as string, dispatchEvent);
        }
    };
});

["mouseenter", "mouseleave"].forEach(function _(name: string) {
    eventHooks[name] = function __(dom: Element, type?: string) {
        const mark = "$$" + type;
        if (!(dom as any)[mark]) {
            (dom as any)[mark] = true;
            const mask = type === "mouseenter" ? "mouseover" : "mouseout";
            addEvent(dom, mask, function ___(e: ISyntheticEvent) {
                const t = getRelatedTarget(e);
                if (!t || (t !== dom && !contains(dom, t))) {
                    const common = getLowestCommonAncestor(dom, t as Element);
                    // 由于不冒泡，因此paths长度为1
                    dispatchEvent(e, type as string, common as Element);
                }
            });
        }
    };
});

const specialHandles: {
    [name: string]: (e: Event) => void;
} = {};
export function createHandle(name: string, fn?: (e: Event) => any) {
    return (specialHandles[name] = function _(e: Event) {
        if (fn && fn(e) === false) {
            return;
        }
        dispatchEvent(e, name);
    });
}

function onCompositionStart(e: ISyntheticEvent) {
    (e.target as any).$$onComposition = true;
}

function onCompositionEnd(e: ISyntheticEvent) {
    (e.target as any).$$onComposition = false;
    // dispatchEvent(e, "change");
}
const input2change = /text|password|search|url|email/i;
// react中，text,textarea,password元素的change事件实质上是input事件
// https://segmentfault.com/a/1190000008023476
if (!(document as any).$$input) {
    globalEvents.input = (document as any).$$input = true;
    addEvent(document, "compositionstart", onCompositionStart);
    addEvent(document, "compositionend", onCompositionEnd);
    addEvent(document, "input", function _(e: Event) {
        const dom = getTarget(e as ISyntheticEvent) as HTMLInputElement;
        if (input2change.test(dom.type)) {
            if (!(dom as any).$$onComposition) {
                dispatchEvent(e, "change");
            }
        }
        dispatchEvent(e);
    });
}

function getLowestCommonAncestor(instA: Node, instB: Node): Node|null {
    let depthA = 0;
    for (let tempA: Node|null = instA; tempA; tempA = tempA.parentNode) {
        depthA++;
    }
    let depthB = 0;
    for (let tempB: Node|null = instB; tempB; tempB = tempB.parentNode) {
        depthB++;
    }

    // If A is deeper, crawl up.
    while (depthA - depthB > 0) {
        instA = instA.parentNode!;
        depthA--;
    }

    // If B is deeper, crawl up.
    while (depthB - depthA > 0) {
        instB = instB.parentNode!;
        depthB--;
    }

    // Walk in lockstep until we find a match.
    let depth = depthA;
    while (depth--) {
        if (instA === instB) {
            return instA;
        }
        instA = instA.parentNode!;
        instB = instB.parentNode!;
    }
    return null;
}

eventPropHooks.change = function change(e: Event) {
    enqueueDuplex(e.target as Element);
};

createHandle("doubleclick");
createHandle("scroll");
createHandle("wheel");
globalEvents.wheel = true;
globalEvents.scroll = true;
globalEvents.doubleclick = true;

if (isTouch) {
    eventHooks.click = eventHooks.clickcapture = function clickcapture(dom: Element) {
        (dom as any).onclick = (dom as any).onclick || noop;
    };
}

eventPropHooks.click = function click(e: Event) {
    return !(e.target as any).disabled;
};

const fixWheelType =
    document.onwheel !== void 0
        ? "wheel"
        : "onmousewheel" in document
            ? "mousewheel"
            : "DOMMouseScroll";
eventHooks.wheel = function wheel(dom: Element) {
    addEvent(dom, fixWheelType, specialHandles.wheel);
};

eventPropHooks.wheel = function _wheel(e: Event) {
    const event = e as ISyntheticEvent;
    event.deltaX =
        "deltaX" in event
            ? event.deltaX
            : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
              "wheelDeltaX" in event
                ? -event.wheelDeltaX!
                : 0;
    event.deltaY =
        "deltaY" in event
            ? event.deltaY
            : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
              "wheelDeltaY" in event
                ? -event.wheelDeltaY!
                : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
                  "wheelDelta" in event
                    ? -event.wheelDelta!
                    : 0;
};

export const focusMap: {
    [name: string]: string;
} = {
    focus: "focus",
    blur: "blur",
};
let innerFocus: boolean;
function blurFocus(e: ISyntheticEvent) {
    let dom = getTarget(e);
    const type = focusMap[e.type];
    if (Renderer.inserting) {
        if (type === "blur") {
            innerFocus = true;
            Renderer.inserting.focus();
            return;
        }
        // return放这里会导致浮层无法关闭
    }
    if (innerFocus) {
        innerFocus = false;
        return;
    }
    do {
        if (dom.nodeType === 1) {
            if (dom.$events && dom.$events[type]) {
                dispatchEvent(e, type);
                break;
            }
        } else {
            break;
        }
    } while ((dom = dom.parentNode as IDuplexElement));
}

["blur", "focus"].forEach(function _blurFocus(type) {
    globalEvents[type] = true;
    if (modern) {
        const mark = "$$" + type;
        if (!(document as any)[mark]) {
            (document as any)[mark] = true;
            addEvent(document, type, blurFocus, true);
        }
    } else {
        eventHooks[type] = function _(dom: Element, name?: string) {
            addEvent(dom, focusMap[name as string] as string, blurFocus);
        };
    }
});

eventHooks.scroll = function _scroll(dom, name) {
    addEvent(dom, name as string, specialHandles[name as string]);
};

eventHooks.doubleclick = function _doubleclick(dom, name) {
    addEvent(document, "dblclick", specialHandles[name as string]);
};

Renderer.eventSystem = {
    eventPropHooks,
    addEvent,
    dispatchEvent,
    SyntheticEvent,
};
