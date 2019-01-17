import { NAMESPACE } from "./browser";
import { patchStyle } from "./style";
import { eventAction, rform } from "./event";
import { typeNumber, emptyObject, noop } from "zreact-core/util";
import { EffectTag } from "zreact-fiber/effect-tag";
import { IFiber } from "zreact-fiber/type-shared";
import { IBaseProps, IBaseObject } from "zreact-core/type-shared";
import { IDuplexElement } from "./duplex";

// 布尔属性的值末必为true,false
// https://github.com/facebook/react/issues/10589

const isSpecialAttr: {[name: string]: number} = {
    style: 1,
    autoFocus: 1,
    innerHTML: 1,
    dangerouslySetInnerHTML: 1,
};

const svgCache: {[name: string]: any} = {};
const strategyCache: {[name: string]: string} = {};
/**
 * 仅匹配 svg 属性名中的第一个驼峰处，如 viewBox 中的 wB，
 * 数字表示该特征在属性列表中重复的次数
 * -1 表示用 ":" 隔开的属性 (xlink:href, xlink:title 等)
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute
 */
const svgCamelCase: {
    [name: string]: {
        [key: string]: number;
    };
} = {
    w: { r: 1, b: 1, t: 1 },
    e: { n: 1, t: 1, f: 1, p: 1, c: 1, m: 1, a: 2, u: 1, s: 1, v: 1 },
    o: { r: 1 },
    c: { m: 1 },
    p: { p: 1 },
    t: { s: 2, t: 1, u: 1, c: 1, d: 1, o: 1, x: 1, y: 1, l: 1 },
    l: { r: 1, m: 1, u: 1, b: -1, l: -1, s: -1 },
    r: { r: 1, u: 2, h: 1, w: 1, c: 1, e: 1 },
    h: { r: 1, a: 1, l: 1, t: 1 },
    y: { p: 1, s: 1, t: 1, c: 1 },
    g: { c: 1 },
    k: { a: -1, h: -1, r: -1, s: -1, t: -1, c: 1, u: 1 },
    m: { o: 1, l: 1, a: 1 },
    n: { c: 1, t: 1, u: 1 },
    s: { a: 3 },
    f: { x: 1, y: 1 },
    d: { e: 1, f: 1, m: 1, d: 1 },
    x: { c: 1 },
};

// SVG 属性列表中驼峰命名和短横线分隔命名特征值有重复
// 列出了重复特征中的短横线命名的属性名
const specialSVGPropertyName: {[key: string]: number} = {
    "overline-thickness": 2,
    "underline-thickness": 2,
    "overline-position": 2,
    "underline-position": 2,
    "stroke-miterlimit": 2,
    "baseline-shift": 2,
    "clip-path": 2,
    "font-size": 2,
    "font-size-adjust": 2,
    "font-stretch": 2,
    "font-style": 2,
    "text-decoration": 2,
    "vert-origin-x": 2,
    "vert-origin-y": 2,
    "paint-order": 2,
    "fill-rule": 2,
    "color-rendering": 2,
    "marker-end": 2,
    "pointer-events": 2,
    "units-per-em": 2,
    "strikethrough-thickness": 2,
    "lighting-color": 2,
};

// 重复属性名的特征值列表
const repeatedKey = [
    "et",
    "ep",
    "em",
    "es",
    "pp",
    "ts",
    "td",
    "to",
    "lr",
    "rr",
    "re",
    "ht",
    "gc",
];

const builtinStringProps: {[name: string]: number} = {
    className: 1,
    title: 1,
    name: 1,
    type: 1,
    alt: 1,
    lang: 1,
};
const skipProps: {[name: string]: any} = {
    innerHTML: 1,
    children: 1,
    onDuplex: noop,
};
const duplexProps = {
    // onDuplex: duplexAction,
    value: 1,
    defaultValue: 1,
    checked: 1,
    //  defaultChecked: 1,
    innerHTML: 1,
    children: 1,
};

function createRepaceFn(split: string) {
    return function repaceFn(match: string): string {
        return match.slice(0, 1) + split + match.slice(1).toLowerCase();
    };
}

const rhump = /([a-z])([A-Z])/;
const toHyphen = createRepaceFn("-");
const toColon = createRepaceFn(":");

function getSVGAttributeName(name: string): string|{name: string; ifSpecial: boolean} {
    if (svgCache[name]) {
        return svgCache[name];
    }
    const match = name.match(rhump);
    if (!match) {
        return (svgCache[name] = name);
    }
    const prefix = match[1];
    const postfix = match[2].toLowerCase();
    const orig = name;
    const count = svgCamelCase[prefix] && svgCamelCase[prefix][postfix];
    if (count) {
        if (count === -1) {
            return (svgCache[orig] = {
                name: name.replace(rhump, toColon),
                ifSpecial: true,
            });
        }
        if (~repeatedKey.indexOf(prefix + postfix)) {
            const dashName = name.replace(rhump, toHyphen);
            if (specialSVGPropertyName[dashName]) {
                name = dashName;
            }
        }
    } else {
        name = name.replace(rhump, toHyphen);
    }
    return (svgCache[orig] = name);
}

export function diffProps(dom: IDuplexElement, lastProps: IBaseProps, nextProps: IBaseProps, fiber: IFiber) {
    const isSVG = fiber.namespaceURI === NAMESPACE.svg;
    const tag = fiber.type;
    let continueProps = skipProps;
    if (!isSVG && rform.test(fiber.type as string)) {
        continueProps = duplexProps;
        if (!("onChange" in nextProps)) {
            eventAction(dom, "onChange", noop, lastProps, fiber);
        }
        fiber.effectTag *= EffectTag.DUPLEX;
        fiber.onDuplex = continueProps.onDuplex;
    }
    // eslint-disable-next-line
    for (const name in nextProps) {
        if (continueProps[name]) {
            continue;
        }
        const val = nextProps[name];
        if (val !== lastProps[name]) {
            const which = String(tag) + isSVG + name;
            let action = strategyCache[which];
            if (!action) {
                action = strategyCache[which] = getPropAction(dom, name, isSVG);
            }
            (actionStrategy as any)[action](dom, name, val, lastProps, fiber);
        }
    }
    // 如果旧属性在新属性对象不存在，那么移除DOM eslint-disable-next-line
    for (const name in lastProps) {
        if (continueProps[name]) {
            continue;
        }
        if (!nextProps.hasOwnProperty(name)) {
            const which = String(tag) + isSVG + name;
            const action = strategyCache[which];
            if (!action) {
                continue;
            }
            (actionStrategy as any)[action](dom, name, false, lastProps, fiber);
        }
    }
}

function isBooleanAttr(dom: Element, name: string): boolean {
    const val = (dom as any)[name];
    return val === true || val === false;
}

function isEventName(name: string): boolean {
    return /^on[A-Z]/.test(name);
}

/**
 * 根据一个属性所在的元素或元素的文档类型，就可以永久决定该使用什么策略操作它
 *
 * @param {any} dom 元素节点
 * @param {any} name 属性名
 * @param {any} isSVG
 * @returns
 */
function getPropAction(dom: Element, name: string, isSVG: boolean) {
    if (isSVG && name === "className") {
        return "svgClass";
    }
    if (isSpecialAttr[name]) {
        return name;
    }
    if (isEventName(name)) {
        return "event";
    }
    if (isSVG) {
        return "svgAttr";
    }
    // img.width = '100px'时,取img.width为0,必须用setAttribute
    if (name === "width" || name === "height") {
        return "attribute";
    }
    if (isBooleanAttr(dom, name)) {
        return "booleanAttr";
    }
    return name.indexOf("data-") === 0 || (dom as any)[name] === void 0
        ? "attribute"
        : "property";
}

export let actionStrategy = {
    style(dom: HTMLElement, _: any, val: IBaseObject, lastProps: IBaseProps) {
        patchStyle(dom, lastProps.style as IBaseObject || emptyObject, val || emptyObject);
    },
    autoFocus(dom: HTMLInputElement) {
        if (
            /input|text/i.test(dom.nodeName) ||
            dom.contentEditable === "true"
        ) {
            dom.focus();
        }
    },
    svgClass(dom: SVGElement, name: string, val: string) {
        if (!val) {
            dom.removeAttribute("class");
        } else {
            dom.setAttribute("class", val);
        }
    },
    svgAttr(dom: Element, name: string, val: any) {
        // http://www.w3school.com.cn/xlink/xlink_reference.asp
        // https://facebook.github.io/react/blog/2015/10/07/react-v0.14.html#notable-enh
        // a ncements xlinkActuate, xlinkArcrole, xlinkHref, xlinkRole, xlinkShow,
        // xlinkTitle, xlinkType eslint-disable-next-line
        const method =
            typeNumber(val) < 3 && !val ? "removeAttribute" : "setAttribute";
        const nameRes = getSVGAttributeName(name);
        if ((nameRes as any).ifSpecial) {
            const prefix = (nameRes as {name: string}).name.split(":")[0];
            // 将xlinkHref 转换为 xlink:href
            (dom as any)[method + "NS"](NAMESPACE[prefix], (nameRes as {name: string}).name, val || "");
        } else {
            (dom as any)[method](nameRes as string, typeNumber(val) !== 3 && !val ? "" : val);
        }
    },
    booleanAttr(dom: Element, name: string, val: any) {
        // 布尔属性必须使用el.xxx = true|false方式设值 如果为false, IE全系列下相当于setAttribute(xxx,""),
        // 会影响到样式,需要进一步处理 eslint-disable-next-line
        (dom as any)[name] = !!val;
        if ((dom as any)[name] === false) {
            dom.removeAttribute(name);
        } else if ((dom as any)[name] === "false") {
            // 字符串属性会将它转换为false
            (dom as any)[name] = "";
        }
    },
    attribute(dom: Element, name: string, val: string|boolean) {
        if (val == null || val === false) {
            return dom.removeAttribute(name);
        }
        try {
            dom.setAttribute(name, val as string);
        } catch (e) {
            console.warn("setAttribute error", name, val); // eslint-disable-line
        }
    },
    property(dom: Element, name: string, val: string|number|boolean) {
        // 尝试直接赋值，部分情况下会失败，如给 input 元素的 size 属性赋值 0 或字符串
        // 这时如果用 setAttribute 则会静默失败
        try {
            if (!val && val !== 0) {
                // 如果是假值但不是0，就改成“”,alt不能removeAttribute
                if (builtinStringProps[name]) {
                    (dom as any)[name] = "";
                } else {
                    dom.removeAttribute(name);
                }
            } else {
                (dom as any)[name] = val;
            }
        } catch (e) {
            try {
                // 修改type会引发多次报错
                dom.setAttribute(name, val as string);
            } catch (e) {
                /*ignore*/
            }
        }
    },
    event: eventAction,
    dangerouslySetInnerHTML(dom: Element, name: string, val: {__html?: string}|undefined, lastProps: IBaseProps) {
        const oldhtml: string = lastProps[name] && lastProps[name].__html;
        let html = val && val.__html;
        html = html == null ? "" : html;
        if (html !== oldhtml) {
            dom.innerHTML = html;
        }
    },
};
