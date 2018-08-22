import { IRefObject } from "./types";

// an immutable object with a single mutable value
export function createRef(): IRefObject {
    const refObject: IRefObject = {
        current: null,
    };
    return refObject;
}
