(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Zreact = {})));
}(this, (function (exports) { 'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var options = {
    eventBind: true,
};

/**
 * 虚拟的Node，与VDom不同，用于生成真实的dom
 */
var VNode = (function () {
    function VNode() {
    }
    return VNode;
}());

// const EMPTY_CHILDREN: any[] = [];
/** JSX/hyperscript reviver
 * Benchmarks: https://esbench.com/bench/57ee8f8e330ab09900a1a1a0
 * 标准JSX转换函数
 * @param {string|Component} nodeName 组件{@link Component}或者原生dom组件名
 * @param {{key: string => value: string}} attributes 组件属性
 * @see http://jasonformat.com/wtf-is-jsx
 * @public
 */
function h(nodeName, attributes) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    // 初始化子元素列表
    var stack = [];
    var children = [];
    // let i: number;
    // let child: any;
    // 是否为原生组件
    var simple;
    // 上一个子元素是否为原生组件
    var lastSimple = false;
    // 把剩余的函数参数全部倒序放入stack
    for (var i = args.length; i--;) {
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
        var child = stack.pop();
        if (child && child.pop !== undefined) {
            // 如果是个数组就倒序放入stack
            for (var i = child.length; i--;) {
                var item = child[i];
                // 修复多个map时不同map的key相同
                // if (typeof item === "object" && item.key) {
                //     item.key = `L${num}-${item.key}`;
                //     num ++;
                // }
                stack.push(item);
            }
        }
        else {
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
                }
                else if (typeof child === "number") {
                    // num to string
                    child = String(child);
                }
                else if (typeof child !== "string") {
                    // 不是 null,number,string 的不做处理
                    // 并且设置标记不是一个字符串
                    simple = false;
                }
            }
            if (simple && lastSimple) {
                // 当前为原生组件且子元素为字符串，并且上一个也是。
                // 就把当前子元素加到上一次的后面。
                children[children.length - 1] += child;
            }
            else {
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
    var p = new VNode();
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

/**
 * 异步调度方法，异步的执行传入的方法
 */
var defer;
if (typeof Promise === "function") {
    var promiseDefer_1 = Promise.resolve();
    defer = function (fn) { return promiseDefer_1.then(fn); };
}
else {
    defer = setTimeout;
}
/**
 * Object.assign的兼容
 */
var extend = Object.assign || function assign_(t) {
    for (var s = void 0, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) {
            if (Object.prototype.hasOwnProperty.call(s, p)) {
                t[p] = s[p];
            }
        }
    }
    return t;
};

/**
 * 通过VNode对象新建一个自定义的props，children的VNode对象
 * @param vnode 旧vnode
 * @param props 新的props
 * @param children 新的子组件
 */
function cloneElement(vnode, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    var child = children.length > 0 ? children : vnode.children;
    return h(vnode.nodeName, extend({}, vnode.attributes, props), child);
}

// 不进行render
var NO_RENDER = 0;
// 同步render标记
var SYNC_RENDER = 1;
// 用于Component.forceUpdate方法更新组件时的标记
var FORCE_RENDER = 2;
// 异步render标记
var ASYNC_RENDER = 3;
// dom的props属性key

// 使用number值的style属性
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

var items = [];
/**
 * 把Component放入队列中等待更新
 * @param component 组件
 */
function enqueueRender(component) {
    if (!component._dirty) {
        // 防止多次render
        component._dirty = true;
        var len = items.push(component);
        if (len === 1) {
            // 在第一次时添加一个异步render，保证同步代码执行完只有一个异步render。
            var deferFun = options.debounceRendering || defer;
            deferFun(rerender);
        }
    }
}
/**
 * 根据Component队列更新dom。
 * 可以setState后直接执行这个方法强制同步更新dom
 */
function rerender() {
    var p;
    var list = items;
    items = [];
    while (p = list.pop()) {
        if (p._dirty) {
            // 防止多次render。
            renderComponent(p);
        }
    }
}

/**
 * 缓存卸载自定义组件对象列表
 */
var components = {};
/**
 * 缓存卸载后的自定义组件
 * @param component 卸载后的组件
 */
function collectComponent(component) {
    var constructor = component.constructor;
    // 获取组件名
    var name = constructor.name;
    // 获取该组件名所属的列表
    var list = components[name];
    if (!list) {
        list = components[name] = [];
    }
    // 设置
    list.push(component);
}
/**
 * 复用已卸载的组件
 * @param Ctor 要创建的组件对象
 * @param props
 * @param context
 */
function createComponent(Ctor, props, context) {
    var list = components[Ctor.name];
    var inst;
    // 创建组件实例
    if (Ctor.prototype && Ctor.prototype.render) {
        inst = new Ctor(props, context);
        Component.call(inst, props, context);
    }
    else {
        // 一个方法
        inst = new Component(props, context);
        // 设置到constructor上
        inst.constructor = Ctor;
        // render用doRender代替
        inst.render = doRender;
    }
    // 查找之前的卸载缓存
    if (list) {
        for (var i = list.length; i--;) {
            var item = list[i];
            if (item.constructor === Ctor) {
                inst.nextVDom = item.nextVDom;
                list.splice(i, 1);
                break;
            }
        }
    }
    return inst;
}
/**
 * 代理render,去除state
 * @param props
 * @param state
 * @param context
 */
function doRender(props, state, context) {
    return this.constructor(props, context);
}

/**
 * 创建一个原生html组件
 * @param nodeName 标签名
 * @param isSvg 是否为svg
 */
function createNode(nodeName, isSvg) {
    var node = isSvg
        ? document.createElementNS("http://www.w3.org/2000/svg", nodeName)
        : document.createElement(nodeName);
    // 设置原始的nodeName到dom上normalizedNodeName
    // node.normalizedNodeName = nodeName;
    return node;
}
/**
 * 移除dom
 * @param node 需要移除的node
 */
function removeNode(node) {
    var parentNode = node.parentNode;
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
function setAccessor(vdom, name, old, value, isSvg) {
    var node = vdom.base;
    if (name === "className") {
        // 把className重名为class
        name = "class";
    }
    if (name === "key") {
        // 不对key属性做dom设置
    }
    else if ("ref" === name) {
        if (old) {
            // 对旧的ref设置null保证原方法里的引用移除
            old(null);
        }
        if (value) {
            // 给新方法设置vdom
            value(vdom);
        }
    }
    else if ("class" === name && !isSvg) {
        // 直接通过className设置class
        node.className = value || "";
    }
    else if ("style" === name) {
        if (!value || typeof value === "string" || typeof old === "string") {
            // 对于字符串型的直接设置到style.cssText
            node.style.cssText = value || "";
        }
        if (value && typeof value === "object") {
            // 如果是一个对象遍历设置
            if (typeof old !== "string") {
                for (var i in old) {
                    if (!(i in value)) {
                        // 清理旧属性且不在新的里
                        node.style[i] = "";
                    }
                }
            }
            for (var i in value) {
                // 设置新属性
                node.style[i] = typeof value[i] === "number"
                    && IS_NON_DIMENSIONAL.test(i) === false ? (value[i] + "px") : value[i];
            }
        }
    }
    else if ("dangerouslySetInnerHTML" === name) {
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
    }
    else if (name[0] === "o" && name[1] === "n") {
        // 事件绑定
        var oldName = name;
        name = name.replace(/Capture$/, "");
        // 判断是否 事件代理(事件委托)
        var useCapture = oldName !== name;
        // 去除前面的on并转换为小写
        name = name.toLowerCase().substring(2);
        if (value) {
            if (!old) {
                // 保证只有一次绑定事件
                addEventListener(vdom, name, useCapture);
            }
        }
        else {
            // 移除事件
            removeEventListener(vdom, name, useCapture);
        }
        if (!vdom.listeners) {
            // 在上下文中创建存放绑定的方法的对象
            vdom.listeners = {};
        }
        vdom.listeners[name] = value;
    }
    else if (name !== "list" && name !== "type" && !isSvg && name in node) {
        // 安全设置属性
        setProperty(node, name, value == null ? "" : value);
        if (value == null || value === false) {
            node.removeAttribute(name);
        }
    }
    else {
        // 设置Attribute
        var ns = isSvg && (name !== (name = name.replace(/^xlink\:?/, "")));
        // null || undefined || void 0 || false
        if (value == null || value === false) {
            if (ns) {
                node.removeAttributeNS("http://www.w3.org/1999/xlink", name.toLowerCase());
            }
            else {
                node.removeAttribute(name);
            }
        }
        else if (typeof value !== "function") {
            if (ns) {
                node.setAttributeNS("http://www.w3.org/1999/xlink", name.toLowerCase(), value);
            }
            else {
                node.setAttribute(name, value);
            }
        }
    }
}
var isIe8 = typeof document.addEventListener !== "function";
function setProperty(node, name, value) {
    try {
        node[name] = value;
    }
    catch (e) { }
}
/**
 * 生成用于绑定事件的方法，保证每次更新props上的事件方法不会重新绑定事件
 * @param child 上下文
 * @param useCapture 是否冒泡(兼容ie8)
 */
function eventProxy(vdom, useCapture) {
    return function (e) {
        if (isIe8 && !useCapture) {
            // ie8事件默认冒泡所以需要阻止
            e.cancelBubble = !useCapture;
        }
        // 取出对于的props事件
        var listener = vdom.listeners && vdom.listeners[e.type];
        // 事件钩子
        var event = options.event && options.event(e) || e;
        if (listener) {
            if (options.eventBind && vdom.component) {
                // 自动使用所属自定义组件来做this
                return listener.call(vdom.component, event);
            }
            // 直接调用事件
            return listener(event);
        }
    };
}


/**
 * 判断是否为Text节点
 * @param node
 */
function isTextNode(node) {
    return node.splitText !== undefined;
}
/**
 * 绑定代理事件
 * @param node dom节点
 * @param name 事件名
 * @param useCapture 是否冒泡
 * @param child 上下文
 */
function addEventListener(vdom, name, useCapture) {
    // 生成当前事件的代理方法
    var eventProxyFun = eventProxy(vdom, useCapture);
    if (!vdom.eventProxy) {
        vdom.eventProxy = {};
    }
    // 把事件代理方法挂载到child.event上等待卸载时使用
    vdom.eventProxy[name] = eventProxyFun;
    var node = vdom.base;
    if (!isIe8) {
        node.addEventListener(name, eventProxyFun, useCapture);
    }
    else {
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
function removeEventListener(vdom, name, useCapture) {
    // 把上下文中的存储的代理事件解绑
    var eventProxyFun = vdom.eventProxy && vdom.eventProxy[name];
    if (vdom.eventProxy && eventProxyFun) {
        vdom.eventProxy[name] = undefined;
    }
    var node = vdom.base;
    if (!isIe8) {
        node.removeEventListener(name, eventProxyFun, useCapture);
    }
    else {
        node.detachEvent("on" + name, eventProxyFun);
    }
}

/**
 * dom节点与vnode是否相同的标签
 * @param node
 * @param vnode
 * @param hydrating
 */
function isSameNodeType(node, vnode, hydrating) {
    if (typeof vnode === "string" || typeof vnode === "number" || typeof vnode === "boolean") {
        // vnode是文本节点,判断dom是否为文本节点
        return isTextNode(node.base);
    }
    if (typeof vnode.nodeName === "string") {
        // vnode是原生组件,判断dom非组件的根节点且标签名相同
        return !node.componentConstructor && isNamedNode(node, vnode.nodeName);
    }
    return hydrating || node.componentConstructor === vnode.nodeName;
}
/** 判断标签名是否相同.
 * @param {Element} node
 * @param {String} nodeName
 */
function isNamedNode(node, nodeName) {
    return node.normalizedNodeName === nodeName
        || (node.base && node.base.nodeName.toLowerCase() === nodeName.toLowerCase());
}
/**
 * 获取当前组件所有地方来的props
 * @param vnode
 */
function getNodeProps(vnode) {
    // jsx上的属性
    var props = extend({}, vnode.attributes);
    props.children = vnode.children;
    // 组件类
    var nodeName = vnode.nodeName;
    // 组件默认props
    var defaultProps = nodeName.defaultProps;
    if (defaultProps !== undefined) {
        for (var i in defaultProps) {
            if (props[i] === undefined) {
                props[i] = defaultProps[i];
            }
        }
    }
    return props;
}
/**
 * 真正dom绑定的一些数据
 * @constructor
 */
var VDom = (function () {
    function VDom(base) {
        this.base = base;
    }
    VDom.prototype.clear = function () {
        this.children = undefined;
        this.component = undefined;
        this.eventProxy = undefined;
        this.listeners = undefined;
        this.normalizedNodeName = undefined;
        this.props = undefined;
        this.componentConstructor = undefined;
    };
    return VDom;
}());
function buildVDom(base) {
    if (base) {
        return new VDom(base);
    }
}

var mounts = [];
var diffLevel = 0;
var isSvgMode = false;
var hydrating = false;
/**
 * 对挂载队列触发挂载完成钩子
 */
function flushMounts() {
    var c;
    while (c = mounts.pop()) {
        var afterMount = options.afterMount;
        if (afterMount) {
            afterMount(c);
        }
        if (c.componentDidMount) {
            c.componentDidMount();
        }
    }
}
/**
 * 比较dom差异
 * @param vdom 原vdom
 * @param vnode jsx
 * @param context 通过render来的是一个空对象。
 * @param mountAll 是否已全部挂载
 * @param parent 挂载元素
 * @param componentRoot 是否为componentRoot
 */
function diff(vdom, vnode, context, mountAll, parent, componentRoot) {
    // if (child.base && dom !== child.base) {
    //     // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
    //     removeDomChild(child);
    // }
    if (!diffLevel++) {
        // 在diff调用递归层数为0时设置isSvgMode，hydrating
        // 判断是否为svg
        isSvgMode = parent != null && parent.ownerSVGDocument !== undefined;
        // 判断是否在上次渲染过了
        hydrating = vdom != null && !(vdom.props);
    }
    // 调用idiff生成dom
    var ret = idiff(vdom, vnode, context, mountAll, componentRoot);
    // 如果有父dom直接appendChild
    if (parent && ret.base.parentNode !== parent) {
        parent.appendChild(ret.base);
    }
    if (!--diffLevel) {
        // diff调用递归层为0,说明已经全部diff完毕
        hydrating = false;
        if (!componentRoot) {
            // 非renderComponent执行的diff如render，触发挂载完成生命周期
            // 通过renderComponent执行的是更新状态，无需重新触发挂载生命周期
            flushMounts();
        }
    }
    return ret;
}
/**
 * 比较dom和vnode，进行新建dom，复用dom，或者新建组件，复用组件
 * @param vdom 原dom
 * @param vnode 用于创建dom的虚拟对象
 * @param context 组件上下文用于组件创建时使用
 * @param mountAll 是否需要挂载
 * @param componentRoot 是否来自renderComponent
 */
function idiff(vdom, vnode, context, mountAll, componentRoot) {
    var prevSvgMode = isSvgMode;
    var out = vdom && vdom.base;
    if (vnode == null || typeof vnode === "boolean") {
        // 去除空，布尔值转为空字符串
        vnode = "";
    }
    if (typeof vnode === "string" || typeof vnode === "number") {
        // 文本节点处理
        if (vdom
            && isTextNode(vdom.base)
            && vdom.base.parentNode
            && (!vdom.component || componentRoot)) {
            // 原dom就是文本节点，更新文本内容
            if (vdom.base.nodeValue !== vnode) {
                vdom.base.nodeValue = String(vnode);
            }
        }
        else {
            // 新建一个文本dom
            var dom = document.createTextNode(String(vnode));
            var newVDom = new VDom(dom);
            if (vdom) {
                // 来自renderComponent判断并处理vdom的子vdom更换
                if (componentRoot) {
                    replaceVDomParent(vdom, newVDom);
                }
                // 如果有旧dom，就替换并卸载旧的。
                if (vdom.base.parentNode) {
                    vdom.base.parentNode.replaceChild(dom, vdom.base);
                }
                recollectNodeTree(vdom, true);
            }
            vdom = newVDom;
        }
        // 文本节点的props直接设置为true
        vdom.props = true;
        return vdom;
    }
    var vnodeName = vnode.nodeName;
    if (typeof vnodeName === "function") {
        // 是一个组件,创建或复用组件实例，返回dom
        return buildComponentFromVNode(vdom, vnode, context, mountAll);
    }
    // 重新判断一下是否要创建svg
    isSvgMode = vnodeName === "svg"
        ? true : vnodeName === "foreignObject" ? false : isSvgMode;
    // 一般通过babel的jsx无法发生非字符串的vnodeName
    vnodeName = String(vnodeName);
    if (!vdom || !isNamedNode(vdom, vnodeName) || !out) {
        // 没有原dom或者原dom与vnode里的不同，新建一个
        out = createNode(vnodeName, isSvgMode);
        var newVDom = new VDom(out);
        if (vdom) {
            // 来自renderComponent判断并处理vdom的子vdom更换
            if (componentRoot) {
                replaceVDomParent(vdom, newVDom);
            }
            // 旧dom存在时的一些处理
            // 把旧dom的子元素全部移动到新dom中
            while (vdom.base.firstChild) {
                out.appendChild(vdom.base.firstChild);
            }
            // 把新dom挂载到旧dom上的位置
            if (vdom.base.parentNode) {
                vdom.base.parentNode.replaceChild(out, vdom.base);
            }
            // 卸载旧dom
            recollectNodeTree(vdom, true);
        }
        vdom = newVDom;
        vdom.normalizedNodeName = vnodeName;
    }
    var fc = out.firstChild;
    // 取出上次存放的props
    var props = vdom.props;
    // 获取虚拟的子节点
    var vchildren = vnode.children;
    if (props == null || typeof props === "boolean") {
        // 上回的props不存在说明，这次一般为新建（preact有可能通过原生dom操作删除）
        vdom.props = props = {};
        // 把dom中的attributes也就是我们常见的setAttribute的属性，取出
        // 据说ie6-7的property也在attributes，就是style，id，class这种
        for (var a = out.attributes, i = a.length; i--;) {
            var attr = a[i];
            props[attr.name] = attr.value;
        }
    }
    // if (vdom.base !== out) {
    //     vdom.base = out;
    // }
    if (!hydrating
        && vchildren
        && vchildren.length === 1
        && typeof vchildren[0] === "string"
        && fc != null
        && isTextNode(fc)
        && fc.nextSibling == null) {
        // 如果未渲染过，且vnode的子元素和dom子元素长度都为1且为文本
        // 替换文本
        if (fc.nodeValue !== vchildren[0]) {
            fc.nodeValue = String(vchildren[0]);
        }
    }
    else if (vchildren && vchildren.length || fc != null) {
        if (vdom.children == null) {
            vdom.children = [];
        }
        // vnode子元素需要渲染或者为空但dom子元素需要清空
        var childrenHydrating = hydrating || (typeof props === "object" && props.dangerouslySetInnerHTML != null);
        diffChildren(vdom, vchildren, context, mountAll, childrenHydrating);
    }
    // 设置dom属性
    diffAttributes(vdom, vnode.attributes, props);
    // 把props存到dom上下文中
    // child[ATTR_KEY] = props;
    // 还原
    isSvgMode = prevSvgMode;
    return vdom;
}
/**
 * 比较子元素进行更新
 * @param vdom 原vdom
 * @param vchildren 虚拟子元素数组
 * @param context 上下文
 * @param mountAll 是否需要挂载
 * @param isHydrating 是否
 */
function diffChildren(vdom, vchildren, context, mountAll, isHydrating) {
    // 取出上次的子元素
    var originalChildren = vdom.children || [];
    var children = [];
    var keyed = {};
    var keyedLen = 0;
    var min = 0;
    var childrenLen = 0;
    var vlen = vchildren ? vchildren.length : 0;
    var j;
    var c;
    var f;
    var vchild;
    var child;
    var pchildren = [];
    var childNodes = vdom.base && vdom.base.childNodes;
    var unChildren = [];
    // 处理真实子元素与上次的dom上下文中存放的子元素数量不对的情况
    // 这种方式只能处理原生添加dom和删除dom。
    if (childNodes.length !== originalChildren.length) {
        var offset = 0;
        var nodeList = childNodes;
        var nodeLen = nodeList.length;
        var newChildren = [];
        for (var i = 0; i < nodeLen; i++) {
            var node = nodeList[i];
            var childVdom = originalChildren[i + offset];
            while (childVdom && node !== childVdom.base) {
                offset++;
                childVdom = originalChildren[i + offset];
            }
            if (childVdom) {
                newChildren.push(childVdom);
            }
            else {
                var newVdom = new VDom(node);
                newChildren.push(newVdom);
            }
        }
        originalChildren = newChildren;
    }
    var len = originalChildren.length;
    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
        for (var i = 0; i < len; i++) {
            var pchild = originalChildren[i];
            var props = pchild.props;
            var key = vlen && props
                ? pchild.component
                    ? pchild.component._key
                    : typeof props === "object" && props.key
                : null;
            if (key != null) {
                keyedLen++;
                keyed[key] = pchild;
            }
            else if (props
                || (isTextNode(pchild.base)
                    ? (isHydrating ? pchild.base.nodeValue && pchild.base.nodeValue.trim() : true)
                    : isHydrating)) {
                children[childrenLen++] = pchild;
            }
        }
    }
    if (vlen !== 0) {
        for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            // attempt to find a node based on key matching
            var key = typeof vchild === "object" && vchild.key;
            if (key != null) {
                if (keyedLen && keyed[key] !== undefined) {
                    child = keyed[key];
                    keyed[key] = undefined;
                    keyedLen--;
                }
            }
            else if (!child && min < childrenLen) {
                // attempt to pluck a node of the same type from the existing children
                for (j = min; j < childrenLen; j++) {
                    c = children[j];
                    if (c !== undefined && isSameNodeType(c, vchild, isHydrating)) {
                        child = c;
                        children[j] = undefined;
                        if (j === childrenLen - 1) {
                            childrenLen--;
                        }
                        if (j === min) {
                            min++;
                        }
                        break;
                    }
                }
            }
            // morph the matched/found/created DOM child to match vchild (deep)
            var pchild = idiff(child, vchild, context, mountAll, false);
            if (pchild.parent !== vdom) {
                pchild.parent = vdom;
            }
            // 把新的props存储对象存储起来
            pchildren.push(pchild);
            // 获取真实
            f = childNodes[i];
            if (pchild.base !== vdom.base && pchild.base !== f) {
                if (f == null) {
                    vdom.base.appendChild(pchild.base);
                }
                else if (pchild.base === f.nextSibling) {
                    var t = f;
                    removeNode(t);
                }
                else {
                    vdom.base.insertBefore(pchild.base, f);
                }
            }
        }
    }
    vdom.children = pchildren;
    // remove unused keyed children:
    if (keyedLen) {
        for (var i in keyed) {
            var keyItem = keyed[i];
            if (keyItem != null) {
                // removeNode(keyed[i].base);
                recollectNodeTree(keyItem, false);
            }
        }
    }
    // remove orphaned unkeyed children:
    while (min <= childrenLen) {
        child = children[childrenLen--];
        if (child !== undefined) {
            // removeNode(child.base);
            recollectNodeTree(child, false);
        }
    }
}
/** 递归回收(或者只是卸载一个)
 * @param node 要被卸载的dom
 * @param unmountOnly 为true则只触发生命周期，跳过删除(仅在dom上的组件索引不存在有效)
 */
function recollectNodeTree(node, unmountOnly) {
    // 获取dom上的组件索引
    var component = node.component;
    if (component) {
        // 如果存在
        unmountComponent(component);
        node.component = undefined;
    }
    else {
        if (typeof node.props === "object" && node.props.ref) {
            // ref用于取消引用dom
            node.props.ref(null);
        }
        if (unmountOnly === false || node.props == null) {
            // 移除dom
            removeNode(node.base);
        }
        // 卸载子dom
        removeChildren(node);
    }
}
function removeChildren(node) {
    // 去除最后一个子元素
    var nodeList = node.children;
    node.children = undefined;
    var len = nodeList ? nodeList.length : 0;
    // node = getLastChild(node && node.base);
    while (nodeList && len--) {
        // 不需要移除因为父级已经移除
        recollectNodeTree(nodeList[len], true);
    }
}
function diffAttributes(vdom, attrs, old) {
    var dom = vdom.base;
    var name;
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            var oldValue = old[name];
            var value = old[name] = undefined;
            setAccessor(vdom, name, oldValue, value, isSvgMode);
        }
    }
    if (attrs) {
        for (name in attrs) {
            if (name !== "children"
                && name !== "innerHTML"
                && (!(name in old)
                    || attrs[name] !== (name === "value"
                        || name === "checked"
                        ? dom[name]
                        : old[name]))) {
                var oldValue = old[name];
                var value = old[name] = attrs[name];
                setAccessor(vdom, name, oldValue, value, isSvgMode);
            }
        }
    }
}
function replaceVDomParent(oldVDom, vdom) {
    if (oldVDom.parent && oldVDom.parent.children) {
        vdom.parent = oldVDom.parent;
        var index = oldVDom.parent.children.indexOf(oldVDom);
        if (index !== -1) {
            oldVDom.parent.children[index] = vdom;
        }
    }
}

/**
 * 设置props，通常来自jsx
 * @param component 组件
 * @param props 新的props
 * @param opts render的执行方式
 * @param context 新的context
 * @param mountAll 是否已挂载
 */
function setComponentProps(component, props, opts, context, mountAll) {
    if (component._disable) {
        // 如果组件已停用就什么都不做
        return;
    }
    // 阻止在异步时再次进入
    component._disable = true;
    // 取出ref设置到组件上
    var ref = component._ref = props.ref;
    if (ref) {
        // 清理掉props中的ref
        delete props.ref;
    }
    // 同上
    var key = component._key = props.key;
    if (key) {
        // 清理掉props中的key
        delete props.key;
    }
    if (!component.vdom || mountAll) {
        // 如果没有插入到DOM树或正在被render渲染执行钩子
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    }
    else if (component.componentWillReceiveProps) {
        // 更新的钩子
        component.componentWillReceiveProps(props, context);
    }
    if (context && context !== component.context) {
        // 保存旧的context，设置新的context
        if (!component.prevContext) {
            component.prevContext = component.context;
        }
        component.context = context;
    }
    // 同上
    if (!component.prevProps) {
        component.prevProps = component.props;
    }
    component.props = props;
    // 进入renderComponent前启用组件
    component._disable = false;
    if (opts !== NO_RENDER) {
        // 进行renderComponent
        if (opts === SYNC_RENDER
            || options.syncComponentUpdates !== false
            || !component.vdom) {
            // 同步执行
            renderComponent(component, SYNC_RENDER, mountAll);
        }
        else {
            // 异步执行
            enqueueRender(component);
        }
    }
    // 用于react的标准ref用于dom实例化完成后组件引用，多用于函数组件。
    if (component._ref) {
        component._ref(component);
    }
}
/**
 * 执行render，diff或新建render
 * @param {Component} component
 * @param {number?} opts
 * @param {boolean?} mountALL
 * @param {boolean?} isChild
 */
function renderComponent(component, opts, mountALL, isChild) {
    if (component._disable) {
        // 组件已停用直接不做操作。
        return;
    }
    // 获取组件props
    var props = component.props;
    // 获取组件state
    var state = component.state;
    // 获取组件context
    var context = component.context;
    // 获取组件上一次的props没有取当前
    var previousProps = component.prevProps || props;
    // 获取组件上一次的state没有取当前
    var previousState = component.prevState || state;
    // 获取组件上一次的context没有取当前
    var previousContext = component.prevContext || context;
    // 判断是否已有vdom
    var isUpdate = component.vdom;
    // 上次移除的vdom
    var nextVDom = component.nextVDom;
    // 组件vdom
    var initialVDom = isUpdate || nextVDom;
    // 获取当前组件的子组件
    var initialChildComponent = component._component;
    // 略过dom更新标记
    var skip = false;
    var cvdom;
    if (isUpdate) {
        // 有dom元素在组件上说明是更新操作.
        // 把组件上的props，state，context都返回到更新前
        component.props = previousProps;
        component.state = previousState;
        component.context = previousContext;
        if (opts !== FORCE_RENDER
            && component.shouldComponentUpdate
            && component.shouldComponentUpdate(props, state, context) === false) {
            // 非用户代码调用(Component.forceUpdate),就执行shouldComponentUpdate钩子
            // 也就是说如果使用Component.forceUpdate来更新render执行就无法被阻止
            // shouldComponentUpdate钩子把新的props,state,context作为参数传入
            // 如果shouldComponentUpdate钩子返回false，跳过下面的dom操作。
            skip = true;
        }
        else if (component.componentWillUpdate) {
            // render 前钩子与shouldComponentUpdate互斥, Component.forceUpdate更新依旧会触发该钩子。
            component.componentWillUpdate(props, state, context);
        }
        // 把组件上的props，state，context都设置到新的
        component.props = props;
        component.state = state;
        component.context = context;
    }
    // 清理掉
    component.prevProps = undefined;
    component.prevState = undefined;
    component.prevContext = undefined;
    component.nextVDom = undefined;
    // 重置_dirty
    component._dirty = false;
    if (!skip) {
        // 当前组件的render函数返回的VNode
        var rendered = component.render(props, state, context);
        //
        var inst = void 0;
        if (component.getChildContext) {
            context = extend(context, component.getChildContext());
        }
        // 取出VNode的nodeName
        var childComponent = rendered && rendered.nodeName;
        var toUnmount = void 0;
        var vdom = void 0;
        if (typeof childComponent === "function" && rendered) {
            // 如果是自定义组件
            // if (component.child) {
            //     component.child = undefined;
            // }
            // 获取VNode上的props
            var childProps = getNodeProps(rendered);
            inst = initialChildComponent;
            if (inst && inst.constructor === childComponent && childProps.key === inst._key) {
                // 子组件已存在且key未变化只改变props
                setComponentProps(inst, childProps, SYNC_RENDER, context, false);
            }
            else {
                if (inst) {
                    // 设置到toUnmount等待unmount
                    toUnmount = inst;
                }
                // 新建Component
                inst = createComponent(childComponent, childProps, context);
                // 子组件索引保证下次相同子组件不会重新创建
                component._component = inst;
                // 设置好缓存dom
                inst.nextVDom = inst.nextVDom || nextVDom;
                // 设置父组件索引
                inst._parentComponent = component;
                // 设置props但是不进行render
                setComponentProps(inst, childProps, NO_RENDER, context, false);
                // 递归调用renderComponent保证子组件的子组件创建
                renderComponent(inst, SYNC_RENDER, mountALL, true);
            }
            // 把子组件dom设置到base
            vdom = inst.vdom;
        }
        else {
            // 原生组件
            // 获取原dom或缓存dom
            cvdom = initialVDom;
            // 把自定义子组件放到卸载，对应使用if分支控制自定义组件和原生组件
            toUnmount = initialChildComponent;
            if (toUnmount) {
                // 如果存在说明上次渲染时是一个自定义组件
                // 清理子组件索引
                component._component = undefined;
                // 清理vdom索引
                cvdom = undefined;
            }
            if (initialVDom || opts === SYNC_RENDER) {
                // 组件dom，缓存dom，同步渲染
                if (component.vdom && component.vdom.component) {
                    // 清理component索引防止使用同一个component情况下却卸载了。
                    component.vdom.component = undefined;
                    //
                    // const b: any = cbase;
                    // b._component = undefined;
                }
                // 渲染原生组件
                vdom = diff(
                // 原dom
                cvdom, 
                // VNode
                rendered, context, 
                // 父级或者该原生组件，原dom不存在说明必须触发生命周期
                mountALL || !isUpdate, 
                // 把组件挂载到缓存dom的父级
                initialVDom && initialVDom.base.parentNode, 
                // 以原生组件这里执行说明是自定义组件的第一个原生组件
                true);
            }
        }
        if (initialVDom && vdom !== initialVDom && inst !== initialChildComponent) {
            // 存在缓存dom，现dom和缓存dom不相同且新建过自定义子组件
            // 获取当前组件缓存dom的父级dom
            var baseParent = initialVDom.base.parentNode;
            if (vdom && baseParent && vdom.base !== baseParent) {
                // 替换到新dom
                baseParent.replaceChild(vdom.base, initialVDom.base);
                if (!toUnmount) {
                    // 没有
                    initialVDom.component = undefined;
                    recollectNodeTree(initialVDom, false);
                }
            }
        }
        if (toUnmount) {
            // 卸载无用的自定义组件
            unmountComponent(toUnmount);
        }
        // 当前自定义组件的根dom
        component.vdom = vdom;
        if (vdom && !isChild) {
            // 创建了dom且不是子组件渲染
            var componentRef = component;
            var t = component;
            // 获取根自定义组件，有可能是一个子组件变化数据
            while ((t = t._parentComponent)) {
                componentRef = t;
                componentRef.vdom = vdom;
            }
            // 保证dom的上下文为根自定义组件
            vdom.component = componentRef;
            vdom.componentConstructor = componentRef.constructor;
        }
    }
    if (!isUpdate || mountALL) {
        // 新建dom的需要触发componentDidMount放入mounts等待生命周期触发
        mounts.unshift(component);
    }
    else if (!skip) {
        // 没有skip render的话触发component.componentDidUpdate，options.afterUpdate钩子
        if (component.componentDidUpdate) {
            component.componentDidUpdate(previousProps, previousState, previousContext);
        }
        if (options.afterUpdate) {
            options.afterUpdate(component);
        }
    }
    if (component._renderCallbacks != null) {
        // 触发所有回调
        while (component._renderCallbacks.length) {
            component._renderCallbacks.pop().call(component);
        }
    }
    if (!diffLevel && !isChild) {
        // 根状态下触发生命周期
        flushMounts();
    }
}
/**
 * 创建Component实例，buildComponentFromVNode创建的一般为父级为原生，或没有
 * @param dom 原dom
 * @param vnode VNode实例
 * @param context 父组件来的上下文
 * @param mountALL 是否需要挂载om
 * @param child 父组件用来对dom元素的上下文
 */
function buildComponentFromVNode(vdom, vnode, context, mountALL) {
    // 获取根组件缓存
    var c = vdom && vdom.component;
    var originalComponent = c;
    // 判断是否为同一个组件类
    var isDiectOwner = vdom && vdom.componentConstructor === vnode.nodeName;
    var isOwner = isDiectOwner;
    // 获取jsx上的属性
    var props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
        // 向上查找
        isOwner = c.constructor === vnode.nodeName;
    }
    if (c && isOwner && (!mountALL || c._component)) {
        // 获取到可复用的组件，重新设置props，复用状态下有dom所有为了流畅使用异步
        setComponentProps(c, props, ASYNC_RENDER, context, mountALL);
        vdom = c.vdom;
    }
    else {
        var oldVDom = vdom;
        // 不存在可以复用的组件
        if (originalComponent && !isDiectOwner) {
            // 存在旧组件卸载它
            unmountComponent(originalComponent);
            vdom = oldVDom = null;
        }
        // 通过缓存组件的方式创建组件实例
        c = createComponent(vnode.nodeName, props, context);
        if (vdom && !c.nextVDom) {
            // 上次这个标签为原生组件，把将要卸载的组件dom缓存
            c.nextVDom = vdom;
            oldVDom = null;
        }
        // 留下旧的上下文等待卸载
        // const oldChild = extend({}, child);
        // if (child.base) {
        //     // 清空等待新的上下文
        //     removeDomChild(child);
        // }
        // 设置props，并创建dom
        setComponentProps(c, props, SYNC_RENDER, context, mountALL);
        // 获取dom
        vdom = c.vdom;
        if (oldVDom && vdom !== oldVDom) {
            // 需要卸载dom
            oldVDom.component = undefined;
            recollectNodeTree(oldVDom, false);
        }
    }
    return vdom;
}
/**
 * 卸载组件
 * @param component 组件
 */
function unmountComponent(component) {
    if (options.beforeUnmount) {
        // 触发全局钩子
        options.beforeUnmount(component);
    }
    var vdom = component.vdom;
    // 停用组件
    component._disable = true;
    if (component.componentWillUnmount) {
        // 钩子
        component.componentWillUnmount();
    }
    // 清理dom索引
    component.vdom = undefined;
    // 获取子组件
    var inner = component._component;
    if (inner) {
        unmountComponent(inner);
    }
    else if (vdom) {
        if (typeof vdom.props === "object" && vdom.props.ref) {
            // 触发dom卸载时的ref事件解除dom索引
            vdom.props.ref(null);
        }
        // 卸载组件dom前把它存到nextBase
        component.nextVDom = vdom;
        // 从dom上移除
        removeNode(vdom.base);
        // 放入全局缓存对象保存
        collectComponent(component);
        // 清空上下文
        removeChildren(vdom);
    }
    if (component._ref) {
        // 解除外部对组件实例的索引
        component._ref(null);
    }
}

var Component = (function () {
    function Component(props, context) {
        // 初始化为true
        this._dirty = true;
        this.context = context;
        this.props = props;
        this.state = this.state || {};
    }
    /**
     * 设置state并通过enqueueRender异步更新dom
     * @param state 对象或方法
     * @param callback render执行完后的回调。
     */
    Component.prototype.setState = function (state, callback) {
        var s = this.state;
        if (!this.prevState) {
            // 把旧的状态保存起来
            this.prevState = extend({}, s);
        }
        // 把新的state和并到this.state
        if (typeof state === "function") {
            var newState = state(s, this.props);
            if (newState) {
                extend(s, newState);
            }
        }
        else {
            extend(s, state);
        }
        if (callback) {
            // 添加回调
            this._renderCallbacks = this._renderCallbacks || [];
            this._renderCallbacks.push(callback);
        }
        // 异步队列更新dom，通过enqueueRender方法可以保证在一个任务栈下多次setState但是只会发生一次render
        enqueueRender(this);
    };
    /**
     * 手动的同步更新dom
     * @param callback 回调
     */
    Component.prototype.forceUpdate = function (callback) {
        if (callback) {
            this._renderCallbacks = this._renderCallbacks || [];
            this._renderCallbacks.push(callback);
        }
        // 重新执行render
        renderComponent(this, FORCE_RENDER);
    };
    /**
     * 用来生成VNode的函数，一定要继承后覆盖
     * @param props
     * @param state
     * @param context
     */
    Component.prototype.render = function (props, state, context) {
        // console.error("not set render");
    };
    return Component;
}());

/**
 * 简单组件state,props对象只有一层改变使用，超过一层改变就会无法更新
 * @constructor
 */
var PureComponent = (function (_super) {
    __extends(PureComponent, _super);
    function PureComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isPureReactComponent = true;
        return _this;
    }
    PureComponent.prototype.shouldComponentUpdate = function (props, state) {
        // props,state只要一个不同就返回true
        return shallowDiffers(this.props, props) || shallowDiffers(this.state, state);
    };
    return PureComponent;
}(Component));
/**
 * 判断两对象的属性值不同
 * @param a
 * @param b
 */
function shallowDiffers(a, b) {
    for (var i in a) {
        if (!(i in b)) {
            return true;
        }
    }
    for (var i in b) {
        if (a[i] !== b[i]) {
            return true;
        }
    }
    return false;
}

/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 * @param domChild 虚拟dom用于挂载原来挂载在dom元素上的属性
 */
function render(vnode, parent, vdom) {
    var base = diff(vdom, vnode, {}, false, parent, false);
    return base;
}

/**
 * 类似React.createClass, 但未bind(this)
 * @param obj
 */
function createClass(obj) {
    var cl = function (props, context) {
        Component.call(this, props, context);
    };
    // 保证后面的实例的constructor指向cl
    obj = extend({ constructor: cl }, obj);
    if (obj.defaultProps) {
        // 获取defaultProps
        cl.defaultProps = obj.defaultProps;
    }
    // prototype链
    F.prototype = Component.prototype;
    cl.prototype = extend(new F(), obj);
    // 组件名
    cl.displayName = obj.displayName || "Component";
    return cl;
}
var F = (function () {
    function F() {
    }
    return F;
}());

var zreact = {
    Component: Component,
    PureComponent: PureComponent,
    buildVDom: buildVDom,
    cloneElement: cloneElement,
    createClass: createClass,
    createElement: h,
    h: h,
    options: options,
    render: render,
    rerender: rerender,
};

exports['default'] = zreact;
exports.Component = Component;
exports.PureComponent = PureComponent;
exports.buildVDom = buildVDom;
exports.cloneElement = cloneElement;
exports.createClass = createClass;
exports.createElement = h;
exports.h = h;
exports.options = options;
exports.render = render;
exports.rerender = rerender;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=zreact.js.map
