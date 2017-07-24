import { Component } from "./component";
import { extend } from "./util";

export function createClass(obj: any) {
    const cl: any = function(props: any, context: any) {
        Component.call(this, props, context, {});
    };
    obj = extend({ constructor: cl }, obj);
    if (obj.defaultProps) {
        cl.defaultProps = obj.defaultProps;
    }
    F.prototype = Component.prototype;
    cl.prototype = extend(new F(), obj);

    cl.displayName = obj.displayName || "Component";
    return cl;
}

class F {
}
