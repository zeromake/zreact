import { IS_NON_DIMENSIONAL } from "../constants";
import options from "../options";

/**
 * 创建一个原生html组件
 * @param nodeName 标签名
 * @param isSvg 是否为svg
 */
export function createNode(nodeName: string, isSvg: boolean): HTMLElement {
    const node: any = isSvg
        ? document.createElementNS("http://www.w3.org/2000/svg", nodeName)
        : document.createElement(nodeName);
    // 设置原始的nodeName到dom上normalizedNodeName
    node.normalizedNodeName = nodeName;
    return node;
}

/**
 * 移除dom
 * @param node 需要移除的node
 */
export function removeNode(node: HTMLElement) {
    const parentNode = node.parentNode;
    if (parentNode) {
        parentNode.removeChild(node);
    }
}

/**
 * 通过VNode的props设置真实的dom
 * @param node dom节点
 * @param name 属性名
 * @param old 旧属性值
 * @param value 新属性值
 * @param isSvg 是否为svg
 * @param child VDom原dom上的props，和上下文环境，事件就在其中
 */
export function setAccessor(
    node: any,
    name: string,
    old: any,
    value: any,
    isSvg: boolean,
    child: any,
) {
    if (name === "className") {
        // 把className重名为class
        name = "class";
    }
    if (name === "key") {
        // 不对key属性做dom设置
    } else if ("ref" === name) {
        if (old) {
            // 对旧的ref设置null保证原方法里的引用移除
            old(null);
        }
        if (value) {
            // 给新方法设置dom
            value(node);
        }
    } else if ("class" === name && !isSvg) {
        // 直接通过className设置class
        node.className = value || "";
    } else if ("style" === name) {
        if (!value || typeof value === "string" || typeof old === "string") {
            // 对于字符串型的直接设置到style.cssText
            node.style.cssText = value || "";
        }
        if (value && typeof value === "object") {
            // 如果是一个对象遍历设置
            if (typeof old !== "string") {
                for (const i in old) {
                    if (!(i in value)) {
                        // 清理旧属性且不在新的里
                        node.style[i] = "";
                    }
                }
            }
            for (const i in value) {
                // 设置新属性
                node.style[i] = typeof value[i] === "number"
                && IS_NON_DIMENSIONAL.test(i) === false ? (value[i] + "px") : value[i];
            }
        }
    } else if ("dangerouslySetInnerHTML" === name) {
        if (value) {
            // innerHTML
            node.innerHTML = value.__html || "";
            // child.children = [];
            // const childNodes = node.childNodes;
            // for (let i = 0, len = childNodes.length; i < len ; i++) {
            //     child.children.push({
            //         base: childNodes[i],
            //     });
            // }

        }
    } else if (name[0] === "o" && name[1] === "n") {
        // 事件绑定
        const oldName = name;
        name = name.replace(/Capture$/, "");
        // 判断是否 事件代理(事件委托)
        const useCapture = oldName !== name;
        // 去除前面的on并转换为小写
        name = name.toLowerCase().substring(2);
        if (value) {
            if (!old) {
                // 保证只有一次绑定事件
                addEventListener(node, name, useCapture, child);
            }
        } else {
            // 移除事件
            removeEventListener(node, name, useCapture, child);
        }
        if (!child._listeners) {
            // 在上下文中创建存放绑定的方法的对象
            child._listeners = {};
        }
        child._listeners[name] = value;
    } else if (name !== "list" && name !== "type" && !isSvg && name in node) {
        // 安全设置属性
        setProperty(node, name, value == null ? "" : value);
        if (value == null || value === false) {
            node.removeAttribute(name);
        }
    } else {
        // 设置Attribute
        const ns = isSvg && (name !== (name = name.replace(/^xlink\:?/, "")));
        // null || undefined || void 0 || false
        if (value == null || value === false) {
            if (ns) {
                node.removeAttributeNS(
                    "http://www.w3.org/1999/xlink",
                    name.toLowerCase(),
                );
            } else {
                node.removeAttribute(name);
            }
        } else if (typeof value !== "function") {
            if (ns) {
                node.setAttributeNS(
                    "http://www.w3.org/1999/xlink",
                    name.toLowerCase(),
                    value,
                );
            } else {
                node.setAttribute(name, value);
            }
        }
    }
}

function setProperty(node: any, name: string, value: string) {
    try {
        node[name] = value;
    } catch (e) { }
}

/**
 * 生成用于绑定事件的方法，保证每次更新props上的事件方法不会重新绑定事件
 * @param child 上下文
 * @param useCapture 是否冒泡(兼容ie8)
 */
function eventProxy(child: any, useCapture: boolean): (e: Event) => void {
    return (e: Event) => {
        if (child.isIe8 && !useCapture) {
            // ie8事件默认冒泡所以需要阻止
            e.cancelBubble = !useCapture;
        }
        // 取出对于的props事件
        const listener = child._listeners[e.type];
        // 事件钩子
        const event = options.event && options.event(e) || e;
        if (options.eventBind && child._component) {
            // 自动使用所属自定义组件来做this
            return listener.call(child._component, event);
        }
        // 直接调用事件
        return listener(event);
    };
}

export function getPreviousSibling(node: Node): Node| null {
    return node.previousSibling;
}

export function getLastChild(node: Node): Node| null {
    return node.lastChild;
}

/**
 * 判断是否为Text节点
 * @param node
 */
export function isTextNode(node: Text | any): boolean {
    return node.splitText !== undefined;
}

/**
 * 绑定代理事件
 * @param node dom节点
 * @param name 事件名
 * @param useCapture 是否冒泡
 * @param child 上下文
 */
function addEventListener(node: any, name: string, useCapture: boolean, child: any) {
    if (typeof child.isIe8 !== "number") {
        // 判断是否为ie9以下的浏览器
        child.isIe8 = node.addEventListener ? 0 : 1;
    }
    // 生成当前事件的代理方法
    const eventProxyFun = eventProxy(child, useCapture);
    if (!child.event) {
        child.event = {};
    }
    // 把事件代理方法挂载到child.event上等待卸载时使用
    child.event[name] = eventProxyFun;
    if (!child.isIe8) {
        node.addEventListener(name, eventProxyFun, useCapture);
    } else {
        node.attachEvent("on" + name, eventProxyFun);
    }
}

/**
 * 移除事件
 * @param node dom节点
 * @param name 事件名
 * @param useCapture 是否冒泡
 * @param child 上下文
 */
function removeEventListener(node: any, name: string, useCapture: boolean, child: any) {
    // 把上下文中的存储的代理事件解绑
    const eventProxyFun = child.event[name];
    child.event[name] = undefined;
    if (!child.isIe8) {
        node.removeEventListener(name, eventProxyFun, useCapture);
    } else {
        node.detachEvent("on" + name, eventProxyFun);
    }
}
