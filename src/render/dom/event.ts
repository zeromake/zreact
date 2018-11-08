import { document, modern, contains } from "./browser";
import { isFn, noop, toLowerCase } from "../../core/util";
import { Renderer } from "../../core/create-renderer";
import { enqueueDuplex, IDuplexElement } from "./duplex";

export const rform = /textarea|input|select|option/i;
const globalEvents: {
    [name: string]: (e: Event) => any;
} = {};
export const eventPropHooks = {}; // 用于在事件回调里对事件对象进行
export const eventHooks = {}; // 用于在元素上绑定特定的事件
// 根据onXXX得到其全小写的事件名, onClick --> click, onClickCapture --> click,
// onMouseMove --> mousemove
const eventLowerCache: {[name: string]: string} = {
    onClick: "click",
    onChange: "change",
    onWheel: "wheel",
};

export function eventAction(dom: IDuplexElement, name: string, val: boolean|((e: Event) => any), lastProps, fiber) {
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
