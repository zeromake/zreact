import { typeNumber, getWindow, noop } from "../../core/util";
import { IBaseObject } from "../../core/type-shared";

interface IDOMElement {
    nodeName: string;
    style: IBaseObject;
    children: IDOMElement[];
    documentElement: IDOMElement;
    body: IDOMElement;
    textContent: string;
    replaceChild(...args: any[]): any;
    appendChild(...args: any[]): any;
    removeAttributeNS(...args: any[]): any;
    setAttributeNS(...args: any[]): any;
    removeAttribute(...args: any[]): any;
    setAttribute(...args: any[]): any;
    getAttribute(...args: any[]): any;
    insertBefore(...args: any[]): any;
    removeChild(...args: any[]): any;
    addEventListener(...args: any[]): any;
    removeEventListener(...args: any[]): any;
    attachEvent(...args: any[]): any;
    detachEvent(...args: any[]): any;
    createTextNode(obj: any): boolean;
    createComment(obj: any): boolean;
    createElement(type: string): IDOMElement;
    createElementNS(type: string): IDOMElement;
    createDocumentFragment(type: string): IDOMElement;
}
// 用于后端的元素节点
export function DOMElement(this: IDOMElement, type: string) {
    this.nodeName = type;
    this.style = {};
    this.children = [];
}

[
    "replaceChild",
    "appendChild",
    "removeAttributeNS",
    "setAttributeNS",
    "removeAttribute",
    "setAttribute",
    "getAttribute",
    "insertBefore",
    "removeChild",
    "addEventListener",
    "removeEventListener",
    "attachEvent",
    "detachEvent",
].forEach((name) => {
    DOMElement.prototype.contains = Boolean;
    DOMElement.prototype[name] = noop;
});

export const NAMESPACE = {
    svg: "http://www.w3.org/2000/svg",
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    xhtml: "http://www.w3.org/1999/xhtml",
    math: "http://www.w3.org/1998/Math/MathML",
};
// 用于后端的document
export const fakeDoc: IDOMElement = new (DOMElement as any)();

fakeDoc.createElement = fakeDoc.createElementNS = fakeDoc.createDocumentFragment = function createElement(type: string) {
    return new (DOMElement as any)(type);
};
fakeDoc.createTextNode = fakeDoc.createComment = Boolean;
fakeDoc.documentElement = new (DOMElement as any)("html");
fakeDoc.body = new (DOMElement as any)("body");
fakeDoc.nodeName = "#document";
fakeDoc.textContent = "";

const win = getWindow();
export const inBrowser = !!win.alert;

if (!inBrowser) {
    (win as any).document = fakeDoc;
}

export const document = win.document;

const versions: {
    [name: string]: number;
} = {
    "88": 7, // IE7-8 objectobject
    "80": 6, // IE6 objectundefined
    "00": NaN, // other modern browsers
    "08": NaN,
};

export const msie = (document as any).documentMode || versions[typeNumber(document.all) + "" + typeNumber((win as any).XMLHttpRequest)];

export const modern = /NaN|undefined/.test(msie) || msie > 8;

export function contains(a: Element, b: Element|Node|null) {
    if (b) {
        while ((b = b.parentNode)) {
            if (b === a) {
                return true;
            }
        }
    }
    return false;
}
