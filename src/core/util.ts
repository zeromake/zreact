
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasSymbol = typeof Symbol === "function" && (Symbol as any).for;

export const REACT_ELEMENT_TYPE = hasSymbol ? (Symbol as any).for("react.element") : 0xeac7;

export interface IBaseObject {
    [name: string]: any;
}

export function returnFalse(): boolean {
    return false;
}

export function returnTrue(): boolean {
    return true;
}

export function extend(target: IBaseObject, ...props: IBaseObject[]): IBaseObject {
    for (const prop of props) {
        for (const key in prop) {
            if (hasOwnProperty.call(prop, key)) {
                target[key] = prop[key];
            }
        }
    }
    return target;
}

const numberMap: IBaseObject = {
    // null undefined IE6-8这里会返回[object Object]
    "[object Boolean]": 2,
    "[object Number]": 3,
    "[object String]": 4,
    "[object Function]": 5,
    "[object Symbol]": 6,
    "[object Array]": 7,
};

export let __TYPE = Object.prototype.toString;

export function typeNumber(data: any) {
    if (data === null) {
        return 1;
    }
    if (data === undefined) {
        return 0;
    }
    const a = numberMap[__TYPE.call(data)];
    return a || 8;
}
