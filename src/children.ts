import { VNode } from "./vnode";

declare type Child = VNode[] | undefined | null;
declare type ChildCallback = (item?: VNode, index?: number, arr?: VNode[]) => VNode[];

const arrayMap = Array.prototype.map;
const arrayForEach = Array.prototype.forEach;
const arraySlice = Array.prototype.slice;

const Children = {
    map(children: Child, callback: ChildCallback, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayMap.call(children, callback);
    },
    forEach(children: Child, callback: ChildCallback, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayForEach.call(children, callback);
    },
    count(children: Child) {
        return children && children.length || 0;
    },
    only(children: Child) {
        if (!children || children.length !== 1) {
            throw new TypeError("Children.only() expects only one child.");
        }
        return children[0];
    },
    toArray(children: Child) {
        if (children == null) {
            return [];
        }
        return arraySlice.call(children);
    },
};

export default Children;
