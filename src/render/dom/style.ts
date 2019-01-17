import { camelize } from "zreact-core/util";
import { IBaseObject } from "zreact-core/type-shared";
export const rnumber = /^-?\d+(\.\d+)?$/;

/**
 * 为元素样子设置样式
 *
 * @export
 * @param {any} dom
 * @param {any} lastStyle
 * @param {any} nextStyle
 */
export function patchStyle(dom: HTMLElement, lastStyle: IBaseObject, nextStyle: IBaseObject): void {
    if (lastStyle === nextStyle) {
        return;
    }

    for (let name in nextStyle) {
        let val = nextStyle[name];
        if (lastStyle[name] !== val) {
            name = cssName(name as string, dom) as string;
            if (val !== 0 && !val) {
                val = ""; // 清除样式
            } else if (rnumber.test(val) && !cssNumber[name]) {
                val = val + "px"; // 添加单位
            }
            try {
                // node.style.width = NaN;node.style.width = 'xxxxxxx';
                // node.style.width = undefine 在旧式IE下会抛异常
                (dom.style as any)[name] = val; // 应用样式
            } catch (e) {
                console.warn("dom.style[" + name + "] = " + val + "throw error"); // eslint-disable-line
            }
        }
    }
    // 如果旧样式存在，但新样式已经去掉
    for (let name in lastStyle) {
        if (!(name in nextStyle)) {
            name = cssName(name, dom) as string;
            (dom.style as any)[name] = ""; // 清除样式
        }
    }
}

export const cssNumber: {[name: string]: number} = {};
[
    "animationIterationCount",
    "columnCount",
    "order",
    "flex",
    "flexGrow",
    "flexShrink",
    "fillOpacity",
    "fontWeight",
    "lineHeight",
    "opacity",
    "orphans",
    "widows",
    "zIndex",
    "zoom",
].forEach(function _(name: string) {
    cssNumber[name] = 1;
});

const prefixes = [
    "",
    "-webkit-",
    "-o-",
    "-moz-",
    "-ms-",
];
export const cssMap: {[name: string]: string} = {
    float: "cssFloat",
};

/**
 * 转换成当前浏览器可用的样式名
 *
 * @param {any} name
 * @returns
 */
export function cssName(name: string, dom: HTMLElement): string| null {
    if (cssMap[name]) {
        return cssMap[name];
    }
    const host = (dom && dom.style) || {};
    for (let i = 0, n = prefixes.length; i < n; i++) {
        const camelCase = camelize(prefixes[i] + name);
        if (camelCase in host) {
            return (cssMap[name] = camelCase);
        }
    }
    return null;
}
