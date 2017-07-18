import { VNode } from "./vnode";
import { Component } from "component";

const options: {
    afterUpdate?: (component: Component) => void;
    beforeUnmount?: (component: Component) => void;
    afterMount?: (component: Component) => void;
    syncComponentUpdates?: boolean;
    debounceRendering?: (render: () => void) => void;
    vnode?: (vnode: VNode) => void;
    event?: (event: Event) => any;
    // 是否自动对事件方法绑定this为组件，默认为true(preact没有)
    eventBind?: boolean;
} = {
    eventBind: true,
};

export default options;
