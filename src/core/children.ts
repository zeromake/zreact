import { isValidElement, traverseAllChildren } from "./create-element";
import { VirtualNode, ChildrenType, IVNode, VirtualNodeList } from "./type-shared";
import { noop } from "./util";

export const Children = {
    only(children: ChildrenType): VirtualNode {
        if (isValidElement(children)) {
            return children as VirtualNode;
        }
        throw new TypeError("expect only one child");
    },
    count(children: ChildrenType): number {
        if (children == null) {
            return 0;
        }
        return traverseAllChildren(children, "", noop);
    },
    map(children: ChildrenType, func: callBackType, context?: object|null): VirtualNode[] {
        return proxyIt(children, func, [], context) as VirtualNode[];
    },
    forEach(children: ChildrenType, func: callBackType, context?: object|null): null {
        return proxyIt(children, func, null, context) as null;
    },
    toArray(children: ChildrenType): VirtualNode[] {
        return proxyIt(children, K, []) as VirtualNode[];
    },
};

const userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text: any): string {
    return ("" + text).replace(userProvidedKeyEscapeRegex, "$&/");
}

function proxyIt(children: ChildrenType, func: callBackType, result?: VirtualNode[]|null, context?: object|null): (VirtualNode[]|null|undefined) {
    if (children == null) {
        return [];
    }
    mapChildren(children, null, func, result, context);
    return result;
}

function K(el: any) {
    return el;
}

type callBackType = (child: VirtualNode, childKey: number) => ChildrenType;

export interface IBookKeeping {
    result: VirtualNode[];
    keyPrefix: string|null;
    func: callBackType;
    context: object;
    count: number;
}

function mapChildren(children: ChildrenType, prefix: number|string|null, func: callBackType, result?: VirtualNode[]|null, context?: object|null): void {
    let keyPrefix = "";
    if (prefix != null) {
        keyPrefix = escapeUserProvidedKey(prefix) + "/";
    }
    traverseAllChildren(children, "", traverseCallback as any, {
        context,
        keyPrefix,
        func,
        result,
        count: 0,
    });
}

function traverseCallback(bookKeeping: IBookKeeping, child: VirtualNode, childKey: string|number): void {
    const { result, keyPrefix, func, context } = bookKeeping;

    let mappedChild: ChildrenType = func.call(context, child, bookKeeping.count++);
    if (!result) {
        return;
    }
    if (Array.isArray(mappedChild)) {
        mapChildren(mappedChild, childKey, K, result);
    } else if (mappedChild != null) {
        if (isValidElement(mappedChild)) {
            mappedChild = { ...(mappedChild as IVNode) };
            mappedChild.key =
                keyPrefix +
                (mappedChild.key && (!child || (child as IVNode).key !== mappedChild.key)
                    ? escapeUserProvidedKey(mappedChild.key) + "/"
                    : "") +
                childKey;
        }
        result.push(mappedChild);
    }
}
