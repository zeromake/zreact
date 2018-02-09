import { VNode } from "./vnode";
import { childType } from "./types";
import { isArray } from "./util";

declare type Child = childType[] | childType;
declare type ChildCallback = (item?: childType, index?: number, arr?: childType[]) => VNode[];

const arrayMap = Array.prototype.map;
const arrayForEach = Array.prototype.forEach;
const arraySlice = Array.prototype.slice;

const Children = {
    map(children: Child, callback: ChildCallback, ctx?: any) {
        if (children == null) {
            return null;
        }
        if (!isArray(children)) {
            children = [children as childType];
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
        if (!isArray(children)) {
            children = [children as childType];
        }
        if (ctx && ctx !== children) {
            callback = callback.bind(ctx);
        }
        return arrayForEach.call(children, callback);
    },
    count(children: Child): number {
        if (children == null) {
            return 0;
        }
        if (!isArray(children)) {
            return 1;
        }
        return (children as childType[]).length;
    },
    only(children: Child): childType {
        if (children != null && !isArray(children)) {
            return children as childType;
        }
        throw new TypeError("Children.only() expects only one child.");
    },
    toArray(children: Child) {
        if (children == null) {
            return [];
        } else if (!isArray(children)) {
            return [children as childType];
        }
        return arraySlice.call(children);
    },
};

export default Children;
