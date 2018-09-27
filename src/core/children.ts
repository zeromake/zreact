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
    const(children: ChildrenType): number {
        if (children == null) {
            return 0;
        }
        return traverseAllChildren(children, "", noop);
    },
    map(children: ChildrenType, func: callBackType, context?: object): VirtualNode[] {
        return proxyIt(children, func, [], context);
    },
    forEach(children: ChildrenType, func: callBackType, context?: object): null {
        return proxyIt(children, func, null, context) as null;
    },
    toArray(children: ChildrenType): VirtualNode[] {
        return proxyIt(children, K, []);
    },
};

const userProvidedKeyEscapeRegex = /\/+/g;
function escapeUserProvidedKey(text: any): string {
    return ("" + text).replace(userProvidedKeyEscapeRegex, "$&/");
}

function proxyIt(children: ChildrenType, func: callBackType, result?: VirtualNode[], context?: object): (VirtualNode[]|null) {
    if (children == null) {
        return [];
    }
    mapChildren(children, null, func, result, context);
    return result;
}

function K(el) {
    return el;
}

type callBackType = (child: VirtualNode, childKey: string) => ChildrenType;

export interface IBookKeeping {
    result: VirtualNode[];
    keyPrefix: string|null;
    func: callBackType;
    context: object;
    count: number;
}

function mapChildren(children: ChildrenType, prefix: string, func: callBackType, result?: VirtualNode[], context?: object): void {
    let keyPrefix = "";
    if (prefix != null) {
        keyPrefix = escapeUserProvidedKey(prefix) + "/";
    }
    traverseAllChildren(children, "", traverseCallback, {
        context,
        keyPrefix,
        func,
        result,
        count: 0,
    });
}

function traverseCallback(bookKeeping: IBookKeeping, child: VirtualNode, childKey: string): void {
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
