import { Component } from "../component";

const components: {
    [name: string]: Component[];
} = {};

declare class Function {

}

export function collectComponent(component: Component) {
    const constructor: any = component.constructor;
    const name = constructor.name;
    const list = components[name] || [];
    list.push(component);
}

export function createComponent(Ctor: any, props: any, context: any) {
    const list = components[Ctor.name];
    let inst: Component;
    if (Ctor.prototype && Ctor.prototype.render) {
        inst = new Ctor(props, context);
        Component.call(inst, props, context);
    } else {
        inst = new Component(props, context);
        inst.constructor = Ctor;
        inst.render = function doRender(tprops: any, state: any, tcontext: any) {
            return this.constructor(tprops, tcontext);
        };
    }
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
