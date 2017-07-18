import { Component } from "./component";
import { extend } from "./util";

export function createClass(obj: any) {
    const cl: any = function(props: any, context: any) {
        // bindAll(this);
        Component.call(this, props, context, {});
        // newComponentHook.call(this, props, context);
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

function F() {}
// const AUTOBIND_BLACKLIST = {
//     componentDidMount: 1,
//     componentDidUnmount: 1,
//     componentDidUpdate: 1,
//     componentWillMount: 1,
//     componentWillReceiveProps: 1,
//     componentWillUnmount: 1,
//     componentWillUpdate: 1,
//     constructor: 1,
//     render: 1,
//     shouldComponentUpdate: 1,
// };
// function bindAll(ctx: any) {
//     for (const i in ctx) {
//         const v = ctx[i];
//         if (typeof v === "function" && !v.__bound && !AUTOBIND_BLACKLIST.hasOwnProperty(i)) {
//             (ctx[i] = v.bind(ctx)).__bound = true;
//         }
//     }
// }
