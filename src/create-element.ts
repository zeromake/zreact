import { Component } from "./component";
import options from "./options";
import { VNode } from "./vnode";
import {
    IKeyValue,
    IBaseProps,
    childType,
    NodeName,
} from "./types";
import {
    REACT_FRAGMENT_TYPE,
} from "./util";
import { ForwardRef } from "./forward-ref";

function Fragment(props: IBaseProps | undefined): childType {
    return (props && props.children) as childType;
}

/** JSX/hyperscript reviver
 * Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
 * 标准JSX转换函数
 * @param {string|Component} nodeName 组件{@link Component}或者原生dom组件名
 * @param {{key: string => value: string}} attributes 组件属性
 * @see http://jasonformat.com/wtf-is-jsx
 * @public
 */
export function createElement(this: Component<IKeyValue, IKeyValue> | undefined | void | null, nodeName: NodeName, attributes: IKeyValue | null, ...args: Array<childType|childType[]>) {
    // 初始化子元素列表
    const stack: Array<childType|childType[]> = [];
    let children: childType[] | childType | null = [];
    // let i: number;
    // let child: any;
    // 是否为原生组件
    let simple: boolean;
    // 上一个子元素是否为原生组件
    let lastSimple: boolean = false;
    // 把剩余的函数参数全部倒序放入stack
    for (let i = args.length; i--; ) {
        stack.push(args[i]);
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
        // let num = 0;
        // 取出最后一个
        let child: any = stack.pop();
        if (child && child.pop != null) {
            // 如果是个数组就倒序放入stack
            for (let i = child.length; i-- ; ) {
                const item = child[i];
                // 修复多个map时不同map的key相同
                // if (typeof item === "object" && item.key) {
                //     item.key = `L${num}-${item.key}`;
                //     num ++;
                // }
                stack.push(item);
            }
        } else {
            // 清空布尔
            if (typeof child === "boolean" || child == null || child === "") {
                continue;
                // child = null;
            }
            // 判断当前组件是否为自定义组件
            simple = typeof nodeName !== "function";
            if (simple) {
                // 原生组件的子元素处理
                if (typeof child === "number") {
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
    const childrenLen = children.length;
    if (childrenLen === 0) {
        children = null;
    } else if (childrenLen === 1) {
        children = children[0];
    }
    if (nodeName == null) {
    } else if (nodeName === REACT_FRAGMENT_TYPE) {
        nodeName = Fragment;
    }
    let props = attributes == null ? {} : attributes;
    if (
        (nodeName as typeof ForwardRef).$isForwardRefComponent != null
        && (nodeName as typeof ForwardRef).$isForwardRefComponent
    ) {
        const { ref = null, ...deepProps} = attributes || {};
        deepProps.$$forwardedRef = ref;
        props = deepProps;
    }
    // vnode 钩子
    if (children) {
        props.children = children;
    } else {
        props.children = null;
    }
    const p = new VNode(
        // 设置原生组件名字或自定义组件class(function)
        nodeName,
        props,
    );
    if (options.vnode != null) {
        options.vnode(p);
    }
    return p;
}
