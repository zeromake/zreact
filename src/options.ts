import { VNode } from "./vnode";
import { Component } from "component";

const options: {
    // render更新后钩子比componentDidUpdate更后面执行
    afterUpdate?: (component: Component) => void;
    // dom卸载载前钩子比componentWillUnmount更先执行
    beforeUnmount?: (component: Component) => void;
    // dom挂载后钩子比componentDidMount更先执行
    afterMount?: (component: Component) => void;
    // setComponentProps时强制为同步render
    syncComponentUpdates?: boolean;
    // 自定义异步调度方法，会异步执行传入的方法
    debounceRendering?: (render: () => void) => void;
    // vnode实例创建时的钩子
    vnode?: (vnode: VNode) => void;
    // 事件钩子，可以对event过滤返回的会代替event参数
    event?: (event: Event) => any;
    // 是否自动对事件方法绑定this为组件，默认为true(preact没有)
    eventBind?: boolean;
} = {
    eventBind: true,
};

export default options;
