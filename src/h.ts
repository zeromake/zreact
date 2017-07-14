import options from "./options";
import { VNode } from "./vnode";

// const EMPTY_CHILDREN: any[] = [];

/** JSX/hyperscript reviver
 * Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
 * 标准JSX转换函数
 * @param {string} nodeName 组件或者原生dom组件名
 * @param {{key: string => value: string}} attributes 组件属性
 * @see http://jasonformat.com/wtf-is-jsx
 * @public
 */
export function h(nodeName: string, attributes: any) {
    // 初始化子元素列表
    const stack: any[] = [];
    const children: any[] = [];
    // let i: number;
    // let child: any;
    // 是否为原生组件
    let simple: boolean;
    // 上一个子元素是否为原生组件
    let lastSimple: boolean = false;
    // 把剩余的函数参数全部倒序放入stack
    for (let i = arguments.length; i-- > 2; ) {
        stack.push(arguments[i]);
    }
    // 把元素上属性的children放入栈
    if (attributes && attributes.children != null) {
        if (!stack.length) {
            stack.push(attributes.children);
        }
        // 删除
        delete attributes.children;
    }
    // 把stack一次一次取出
    while (stack.length) {
        // 取出最后一个
        let child: any = stack.pop();
        if (child && child.pop !== undefined) {
            // 如果是个数组就倒序放入stack
            for (let i = child.length; i-- ; ) {
                stack.push(child[i]);
            }
        } else {
            // 清空布尔
            if (typeof child === "boolean") {
                child = null;
            }
            // 判断当前组件是否为自定义组件
            simple = typeof nodeName !== "function";
            if (simple) {
                // 原生组件的子元素处理
                if (child == null) {
                    // null to ""
                    child = "";
                } else if (typeof child === "number") {
                    // num to string
                    child = String(child);
                } else if (typeof child !== "string") {
                    // 不是 null,number,string 的不做处理
                    // 并且设置标记不是一个字符串
                    simple = false;
                }
            }
            if (simple && lastSimple) {
                // 当前为原生组件且子元素为字符串，并且上一个也是。
                // 就把当前子元素加到上一次的后面。
                children[children.length - 1] += child;
            } else {
                // 其它情况直接加入children
                children.push(child);
            }
            /* else if (children === EMPTY_CHILDREN) {
                children = [child];
            } */
            // 记录这次的子元素状态
            lastSimple = simple;
        }
    }
    const p = new VNode();
    // 设置原生组件名字或自定义组件class(function)
    p.nodeName = nodeName;
    // 设置子元素
    p.children = children;
    // 设置属性
    p.attributes = attributes == null ? undefined : attributes;
    // 设置key
    p.key = attributes == null ? undefined : attributes.key;

    // vnode 钩子
    if (options.vnode !== undefined) {
        options.vnode(p);
    }
    return p;
}
