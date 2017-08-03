import { Component } from "./component";
import { extend } from "./util";
import { IKeyValue } from "./types";

/**
 * 类似React.createClass, 但未bind(this)
 * @param obj
 */
export function createClass(obj: any) {
    const cl: any = function(this: any, props: IKeyValue, context: IKeyValue) {
        Component.call(this, props, context);
    };
    // 保证后面的实例的constructor指向cl
    obj = extend({ constructor: cl }, obj);
    if (obj.defaultProps) {
        // 获取defaultProps
        cl.defaultProps = obj.defaultProps;
    }
    // prototype链
    F.prototype = Component.prototype;
    cl.prototype = extend(new F(), obj);
    // 组件名
    cl.displayName = obj.displayName || "Component";
    return cl;
}

class F {
}
