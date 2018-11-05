import { hasOwnProperty, typeNumber } from "./util";

const ObjectIs = (Object as any).is;

/**
 * 判断两个对象是否相同，不深度比较
 * @param objA
 * @param objB
 */
export function shallowEqual(objA: any, objB: any): boolean {
    if (ObjectIs(objA, objB)) {
        return true;
    }
    // 确保objA, objB都是对象
    if (typeNumber(objA) < 7 || typeNumber(objB) < 7) {
        return false;
    }
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) {
        return false;
    }
    // Test for A's keys different from B.
    for (const item of keysA) {
        if (
            !hasOwnProperty.call(objB, item) ||
            !ObjectIs(objA[item], objB[item])
        ) {
            return false;
        }
    }
    return true;
}
