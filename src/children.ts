import { VNode } from "./vnode";

const Children = {
    map(children: VNode[] | undefined, callback: (item?: VNode, index?: number, arr?: VNode[]) => VNode, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return Array.prototype.map.call(children, callback);
    },
    forEach(children: VNode[] | undefined, callback: (item?: VNode, index?: number, arr?: VNode[]) => any, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return Array.prototype.forEach.call(children, callback);
    },
    count(children: any) {
        return children && children.length || 0;
    },
    only(children: any) {
        if (!children || children.length !== 1) {
            throw new Error("Children.only() expects only one child.");
        }
        return children[0];
    },
    toArray(children: any) {
        if (children == null) {
            return [];
        }
        return Array.prototype.slice(children);
    },
};

export default Children;
