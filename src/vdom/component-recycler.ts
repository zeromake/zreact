import { Component } from "../component";
import { IKeyValue } from "../types";

/**
 * 缓存卸载自定义组件对象列表
 */
const components: {
    [name: string]: Component[];
} = {};

/**
 * 缓存卸载后的自定义组件
 * @param component 卸载后的组件
 */
export function collectComponent(component: Component) {
    const constructor: any = component.constructor;
    // 获取组件名
    const name = constructor.name;
    // 获取该组件名所属的列表
    let list = components[name];
    if (!list) {
        list = components[name] = [];
    }
    // 设置
    list.push(component);
}

/**
 * 复用已卸载的组件
 * @param Ctor 要创建的组件对象
 * @param props
 * @param context
 */
export function createComponent(Ctor: any, props: IKeyValue, context: IKeyValue) {
    const list = components[Ctor.name];
    let inst: Component;
    // 创建组件实例
    if (Ctor.prototype && Ctor.prototype.render) {
        inst = new Ctor(props, context);
        Component.call(inst, props, context);
    } else {
        // 一个方法
        inst = new Component(props, context);
        // 设置到constructor上
        inst.constructor = Ctor;
        // render用doRender代替
        inst.render = doRender;
    }
    // 查找之前的卸载缓存
    if (list) {
        for (let i = list.length; i-- ; ) {
            const item = list[i];
            if (item.constructor === Ctor) {
                inst.nextBase = item.nextBase;
                list.splice(i, 1);
                break;
            }
        }
    }
    return inst;
}

/**
 * 代理render,去除state
 * @param props
 * @param state
 * @param context
 */
function doRender(props: IKeyValue, state: IKeyValue, context: IKeyValue) {
    return this.constructor(props, context);
}
