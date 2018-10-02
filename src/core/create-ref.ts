import { IObjectRef } from "./type-shared";

export function createRef(): IObjectRef {
    return {
        current: null,
    };
}

export function forwardRef<T>(fn: T): T {
    (fn as any).isForwardComponent = true;
    return fn;
}
