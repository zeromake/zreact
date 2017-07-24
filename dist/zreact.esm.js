function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var options = {
    eventBind: true,
};

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
        // 取出最后一个
        var child = stack.pop();
        if (child && child.pop !== undefined) {
            // 如果是个数组就倒序放入stack
            for (var i = child.length; i--;) {
                stack.push(child[i]);
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

var defer;
if (typeof Promise === "function") {
    var promiseDefer_1 = Promise.resolve();
    defer = function (fn) { return promiseDefer_1.then(fn); };
}
else {
    defer = setTimeout;
}
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

function cloneElement(vnode, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    return h(vnode.nodeName, extend({}, vnode.attributes, props), children.length > 2 ? children : vnode.children);
}

// 不进行render
var NO_RENDER = 0;
// 同步render标记
var SYNC_RENDER = 1;
// 用于Component.forceUpdate方法更新组件时的标记
var FORCE_RENDER = 2;
// 异步render标记
var ASYNC_RENDER = 3;
var ATTR_KEY = "__preactattr_";
// 使用number值的style属性
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

var items = [];
function enqueueRender(component) {
    if (!component._dirty) {
        component._dirty = true;
        var len = items.push(component);
        if (len === 1) {
            var deferFun = options.debounceRendering || defer;
            deferFun(rerender);
        }
    }
}
function rerender() {
    var p;
    var list = items;
    items = [];
    p = list.pop();
    while (p) {
        if (p._dirty) {
            renderComponent(p);
        }
        p = list.pop();
    }
}

var components = {};
function collectComponent(component) {
    var constructor = component.constructor;
    var name = constructor.name;
    var list = components[name] || [];
    list.push(component);
}
function createComponent(Ctor, props, context) {
    var list = components[Ctor.name];
    var inst;
    if (Ctor.prototype && Ctor.prototype.render) {
        inst = new Ctor(props, context);
        Component.call(inst, props, context);
    }
    else {
        inst = new Component(props, context);
        inst.constructor = Ctor;
        inst.render = doRender;
    }
    if (list) {
        for (var i = list.length; i--;) {
            var item = list[i];
            if (item.constructor === Ctor) {
                inst.nextBase = item.nextBase;
                list.splice(i, 1);
                break;
            }
        }
    }
    return inst;
}
function doRender(props, state, tcontext) {
    return this.constructor(props, tcontext);
}

function createNode(nodeName, isSvg) {
    var node = isSvg
        ? document.createElementNS("http://www.w3.org/2000/svg", nodeName)
        : document.createElement(nodeName);
    node.normalizedNodeName = nodeName;
    return node;
}
function removeNode(node) {
    var parentNode = node.parentNode;
    if (parentNode) {
        parentNode.removeChild(node);
    }
}
function setAccessor(node, name, old, value, isSvg, child) {
    if (name === "className") {
        name = "class";
    }
    if (name === "key") {
        // no set
    }
    else if ("ref" === name) {
        if (old) {
            old(null);
        }
        if (value) {
            value(node);
        }
    }
    else if ("class" === name && !isSvg) {
        node.className = value || "";
    }
    else if ("style" === name) {
        if (!value || typeof value === "string" || typeof old === "string") {
            node.style.cssText = value || "";
        }
        if (value && typeof value === "object") {
            if (typeof old !== "string") {
                for (var i in old) {
                    if (!(i in value)) {
                        node.style[i] = "";
                    }
                }
            }
            for (var i in value) {
                node.style[i] = typeof value[i] === "number"
                    && IS_NON_DIMENSIONAL.test(i) === false ? (value[i] + "px") : value[i];
            }
        }
    }
    else if ("dangerouslySetInnerHTML" === name) {
        if (value) {
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
        var oldName = name;
        name = name.replace(/Capture$/, "");
        var useCapture = oldName !== name;
        name = name.toLowerCase().substring(2);
        if (value) {
            if (!old) {
                addEventListener(node, name, useCapture, child);
            }
        }
        else {
            removeEventListener(node, name, useCapture, child);
        }
        if (!child._listeners) {
            child._listeners = {};
        }
        child._listeners[name] = value;
    }
    else if (name !== "list" && name !== "type" && !isSvg && name in node) {
        setProperty(node, name, value == null ? "" : value);
        if (value == null || value === false) {
            node.removeAttribute(name);
        }
    }
    else {
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
function setProperty(node, name, value) {
    try {
        node[name] = value;
    }
    catch (e) { }
}
function eventProxy(child) {
    return function (e) {
        var listener = child._listeners[e.type];
        var event = options.event && options.event(e) || e;
        if (options.eventBind) {
            return listener.call(child._component, event);
        }
        return listener(event);
    };
}


function isTextNode(node) {
    return node.splitText !== undefined;
}
function addEventListener(node, name, useCapture, child) {
    var eventProxyFun = eventProxy(child);
    if (!child.event) {
        child.event = {};
    }
    child.event[name] = eventProxyFun;
    if (node.addEventListener) {
        node.addEventListener(name, eventProxyFun, useCapture);
    }
    else {
        node.attachEvent("on" + name, eventProxyFun);
    }
}
function removeEventListener(node, name, useCapture, child) {
    var eventProxyFun = child.event[name];
    if (node.removeEventListener) {
        node.removeEventListener(name, eventProxyFun, useCapture);
    }
    else {
        node.detachEvent("on" + name, eventProxyFun);
    }
}

function isSameNodeType(node, vnode, hydrating) {
    if (typeof vnode === "string" || typeof vnode === "number") {
        return isTextNode(node.base);
    }
    if (typeof vnode.nodeName === "string") {
        return !node._componentConstructor && isNamedNode(node.base, vnode.nodeName);
    }
    return hydrating || node._componentConstructor === vnode.nodeName;
}
/** Check if an Element has a given normalized name.
 * @param {Element} node
 * @param {String} nodeName
 */
function isNamedNode(node, nodeName) {
    return node.normalizedNodeName === nodeName
        || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}
function getNodeProps(vnode) {
    var props = extend({}, vnode.attributes);
    props.children = vnode.children;
    var nodeName = vnode.nodeName;
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

var mounts = [];
var diffLevel = 0;
var isSvgMode = false;
var hydrating = false;
function flushMounts() {
    var c = mounts.pop();
    while (c) {
        var afterMount = options.afterMount;
        if (afterMount) {
            afterMount(c);
        }
        if (c.componentDidMount) {
            c.componentDidMount();
        }
        c = mounts.pop();
    }
}
/**
 * 比较dom差异
 * @param dom 原dom
 * @param vnode jsx
 * @param context 通过render来的是一个空对象。
 * @param mountAll 是否已全部挂载
 * @param parent 挂载元素
 * @param componentRoot 是否为componentRoot
 */
function diff(dom, vnode, context, mountAll, parent, componentRoot, child) {
    if (child.base && dom !== child.base) {
        // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
        removeDomChild(child);
    }
    if (!diffLevel++) {
        // 在diff调用递归层数为0时设置isSvgMode，hydrating
        isSvgMode = parent != null && parent.ownerSVGDocument !== undefined;
        hydrating = dom != null && !(child && child[ATTR_KEY]);
    }
    // 调用idiff生成dom
    var ret = idiff(dom, vnode, context, mountAll, componentRoot, child);
    // 如果有父dom直接appendChild
    if (parent && ret.parentNode !== parent) {
        parent.appendChild(ret);
    }
    if (!--diffLevel) {
        // diff调用递归层为0
        hydrating = false;
        if (!componentRoot) {
            flushMounts();
        }
    }
    return ret;
}
function idiff(dom, vnode, context, mountAll, componentRoot, child) {
    // if (child.base && dom !== child.base) {
    //     // 原preact使用dom存放数据，现在，如果dom不存在，且pchild内有dom就卸载掉
    //     removeDomChild(child);
    // }
    var out = dom;
    var prevSvgMode = isSvgMode;
    if (vnode == null || typeof vnode === "boolean") {
        vnode = "";
    }
    if (typeof vnode === "string" || typeof vnode === "number") {
        if (dom
            && isTextNode(dom)
            && dom.parentNode
            && (!child._component || componentRoot)) {
            if (dom.nodeValue !== vnode) {
                dom.nodeValue = vnode;
            }
        }
        else {
            var data = vnode;
            out = document.createTextNode(data);
            if (dom) {
                if (dom.parentNode) {
                    dom.parentNode.replaceChild(out, dom);
                }
                // if (child.base !== dom) {
                //     child.base = dom;
                // }
                recollectNodeTree(child, true);
            }
        }
        child[ATTR_KEY] = true;
        child.base = out;
        return out;
    }
    var vnodeName = vnode.nodeName;
    if (typeof vnodeName === "function") {
        return buildComponentFromVNode(dom, vnode, context, mountAll, child);
    }
    isSvgMode = vnodeName === "svg"
        ? true : vnodeName === "foreignObject" ? false : isSvgMode;
    vnodeName = String(vnodeName);
    if (!dom || !isNamedNode(dom, vnodeName)) {
        out = createNode(vnodeName, isSvgMode);
        if (dom) {
            while (dom.firstChild) {
                out.appendChild(dom.firstChild);
            }
            if (dom.parentNode) {
                dom.parentNode.replaceChild(out, dom);
            }
            // if (child.base !== dom) {
            //     child.base = dom;
            // }
            recollectNodeTree(child, true);
        }
    }
    var fc = out.firstChild;
    var props = child[ATTR_KEY];
    var vchildren = vnode.children;
    if (props == null) {
        props = child[ATTR_KEY] = {};
        for (var a = out.attributes, i = a.length; i--;) {
            var attr = a[i];
            props[attr.name] = attr.value;
        }
    }
    if (child.base !== out) {
        child.base = out;
    }
    if (!hydrating
        && vchildren
        && vchildren.length === 1
        && typeof vchildren[0] === "string"
        && fc != null
        && isTextNode(fc)
        && fc.nextSibling == null) {
        if (fc.nodeValue !== vchildren[0]) {
            fc.nodeValue = vchildren[0];
        }
    }
    else if (vchildren && vchildren.length || fc != null) {
        if (!child.children) {
            child.children = [];
        }
        innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null, child);
    }
    diffAttributes(out, vnode.attributes, props, child);
    isSvgMode = prevSvgMode;
    return out;
}
function innerDiffNode(dom, vchildren, context, mountAll, isHydrating, domChild) {
    var originalChildren = domChild.children;
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
    var childNodes = dom.childNodes;
    var unChildren = [];
    if (childNodes.length !== originalChildren.length) {
        var offset = 0;
        var nodeList = childNodes;
        var nodeLen = nodeList.length;
        var newChildren = [];
        for (var i = 0; i < nodeLen; i++) {
            var node = nodeList[i];
            var vdom = originalChildren[i + offset];
            while (vdom && node !== vdom.base) {
                offset++;
                vdom = originalChildren[i + offset];
            }
            if (vdom) {
                newChildren.push(vdom);
            }
            else {
                newChildren.push({
                    base: node,
                });
            }
        }
        originalChildren = newChildren;
    }
    var len = originalChildren.length;
    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
        for (var i = 0; i < len; i++) {
            var pchild = originalChildren[i];
            var props = pchild[ATTR_KEY];
            var key = vlen && props
                ? pchild._component
                    ? pchild._component.__key
                    : props.key
                : null;
            if (key != null) {
                keyedLen++;
                keyed[key] = pchild;
            }
            else if (props
                || (isTextNode(pchild.base)
                    ? (isHydrating ? pchild.base.nodeValue.trim() : true)
                    : isHydrating)) {
                children[childrenLen++] = pchild;
            }
        }
    }
    if (vlen !== 0) {
        for (var i = 0; i < vlen; i++) {
            vchild = vchildren[i];
            child = null;
            var tchild = null;
            // attempt to find a node based on key matching
            var key = vchild.key;
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
                    if (children[j] !== undefined && isSameNodeType(c, vchild, isHydrating)) {
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
            // 获取上一次的props存储对象
            tchild = child || {};
            // morph the matched/found/created DOM child to match vchild (deep)
            child = idiff(child && child.base, vchild, context, mountAll, false, tchild);
            // 把新的props存储对象存储起来
            pchildren.push(tchild);
            // 获取真实
            f = childNodes[i];
            if (child && child !== dom && child !== f) {
                if (f == null) {
                    dom.appendChild(child);
                }
                else if (child === f.nextSibling) {
                    var t = f;
                    removeNode(t);
                }
                else {
                    dom.insertBefore(child, f);
                }
            }
        }
    }
    domChild.children = pchildren;
    // remove unused keyed children:
    if (keyedLen) {
        for (var i in keyed) {
            if (keyed[i] !== undefined) {
                // removeNode(keyed[i].base);
                recollectNodeTree(keyed[i], false);
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
    var component = node._component;
    if (component) {
        // 如果存在
        unmountComponent(component);
        node._component = null;
        removeDomChild(node);
    }
    else {
        if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) {
            // ref用于取消引用dom
            node[ATTR_KEY].ref(null);
        }
        if (unmountOnly === false || node[ATTR_KEY] == null) {
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
    node.children = [];
    var len = nodeList ? nodeList.length : 0;
    // node = getLastChild(node && node.base);
    while (len--) {
        // 不需要移除因为父级已经移除
        recollectNodeTree(nodeList[len], true);
    }
    // removeDomChild
    removeDomChild(node);
}
function diffAttributes(dom, attrs, old, child) {
    var name;
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            var oldValue = old[name];
            var value = old[name] = undefined;
            setAccessor(dom, name, oldValue, value, isSvgMode, child);
        }
    }
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
            setAccessor(dom, name, oldValue, value, isSvgMode, child);
        }
    }
}

function setComponentProps(component, props, opts, context, mountAll) {
    if (component._disable) {
        return;
    }
    component._disable = true;
    var ref = component._ref = props.ref;
    if (ref) {
        delete props.ref;
    }
    var key = component._key = props.key;
    if (key) {
        delete props.key;
    }
    if (!component.base || mountAll) {
        if (component.componentWillMount) {
            component.componentWillMount();
        }
    }
    else if (component.componentWillReceiveProps) {
        component.componentWillReceiveProps(props, context);
    }
    if (context && context !== component.context) {
        if (!component.prevContext) {
            component.prevContext = component.context;
        }
        component.context = context;
    }
    if (!component.prevProps) {
        component.prevProps = component.props;
    }
    component.props = props;
    component._disable = false;
    if (opts !== NO_RENDER) {
        if (opts === SYNC_RENDER
            || options.syncComponentUpdates !== false
            || !component.base) {
            renderComponent(component, SYNC_RENDER, mountAll);
        }
        else {
            enqueueRender(component);
        }
    }
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
    // 判断是否已有dom元素
    var isUpdate = component.base;
    // 被移除过时保存的dom
    var nextBase = component.nextBase;
    var initialBase = isUpdate || nextBase;
    // 获取当前组件的子组件
    var initialChildComponent = component._component;
    // 略过dom更新标记
    var skip = false;
    var cbase;
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
    component.prevProps = null;
    component.prevState = null;
    component.prevContext = null;
    component.nextBase = undefined;
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
        var base = void 0;
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
                    toUnmount.child = extend({}, toUnmount.child);
                    // 防止共享子dom
                    inst.child.children = [];
                }
                // 新建Component
                inst = createComponent(childComponent, childProps, context);
                // 子组件索引保证下次相同子组件不会重新创建
                component._component = inst;
                // 设置好缓存dom
                inst.nextBase = inst.nextBase || nextBase;
                // 设置父组件索引
                inst._parentComponent = component;
                // 设置domchild
                inst.child = component.child;
                // 设置props但是不进行render
                setComponentProps(inst, childProps, NO_RENDER, context, false);
                // 递归调用renderComponent保证子组件的子组件创建
                renderComponent(inst, SYNC_RENDER, mountALL, true);
            }
            // 把子组件dom设置到base
            base = inst.base;
        }
        else {
            // 原生组件
            // 获取原dom或缓存dom
            cbase = initialBase;
            // 把自定义子组件放到卸载，对应使用if分支控制自定义组件和原生组件
            toUnmount = initialChildComponent;
            if (toUnmount) {
                // 如果存在说明上次渲染时是一个自定义组件
                // 清理子组件索引
                component._component = undefined;
                // 清理dom索引
                cbase = undefined;
            }
            if (initialBase || opts === SYNC_RENDER) {
                // 组件dom，缓存dom，同步渲染
                if (component.child && component.child._component) {
                    // 清理component索引防止使用同一个component情况下却卸载了。
                    component.child._component = undefined;
                    //
                    // const b: any = cbase;
                    // b._component = undefined;
                }
                if (!component.child) {
                    component.child = {};
                }
                // 渲染原生组件
                base = diff(
                // 原dom
                cbase, 
                // VNode
                rendered, context, 
                // 父级组件需要挂载，或者dom不存在也需要挂载
                mountALL || !isUpdate, 
                // 把组件挂载到缓存dom的父级
                initialBase && initialBase.parentNode, 
                // 以原生组件这里执行说明是自定义组件的第一个原生组件
                true, component.child);
            }
        }
        if (initialBase && base !== initialBase && inst !== initialChildComponent) {
            // 存在缓存dom，现dom和缓存dom不相同且新建过自定义子组件
            // 获取当前组件缓存dom的父级dom
            var baseParent = initialBase.parentNode;
            if (base && baseParent && base !== baseParent) {
                // 替换到新dom
                baseParent.replaceChild(base, initialBase);
                if (!toUnmount) {
                    // 没有
                    // const initBase: any = initialBase;
                    // 去除dom上的component索引
                    // initBase._component = null;
                    component.child.base = initialBase;
                    component.child._component = null;
                    recollectNodeTree(component.child, false);
                    component.child.base = null;
                }
            }
        }
        if (toUnmount) {
            unmountComponent(toUnmount);
        }
        component.base = base;
        if (base && !isChild) {
            var componentRef = component;
            var t = component;
            while ((t = t._parentComponent)) {
                componentRef = t;
                componentRef.base = base;
            }
            // const _base: any = base;
            // try {
            //     _base._component = componentRef;
            //     _base._componentConstructor = componentRef.constructor;
            // } catch (e) {}
            component.child._component = componentRef;
            component.child._componentConstructor = componentRef.constructor;
            // component.child.base = base;
        }
    }
    if (!isUpdate || mountALL) {
        mounts.unshift(component);
    }
    else if (!skip) {
        if (component.componentDidUpdate) {
            component.componentDidUpdate(previousProps, previousState, previousContext);
        }
        if (options.afterUpdate) {
            options.afterUpdate(component);
        }
    }
    if (component._renderCallbacks != null) {
        while (component._renderCallbacks.length) {
            component._renderCallbacks.pop().call(component);
        }
    }
    if (!diffLevel && !isChild) {
        flushMounts();
    }
}
function buildComponentFromVNode(dom, vnode, context, mountALL, child) {
    var c = child && child._component;
    var originalComponent = c;
    var oldDom = dom;
    var isDiectOwner = c && child._componentConstructor === vnode.nodeName;
    var isOwner = isDiectOwner;
    var props = getNodeProps(vnode);
    while (c && !isOwner && (c = c._parentComponent)) {
        isOwner = c.constructor === vnode.nodeName;
    }
    if (c && isOwner && (!mountALL || c._component)) {
        setComponentProps(c, props, ASYNC_RENDER, context, mountALL);
        dom = c.base;
    }
    else {
        if (originalComponent && !isDiectOwner) {
            unmountComponent(originalComponent);
            dom = oldDom = null;
        }
        c = createComponent(vnode.nodeName, props, context);
        if (dom && !c.nextBase) {
            c.nextBase = dom;
            oldDom = null;
        }
        c.child = child;
        // child._component = c;
        setComponentProps(c, props, SYNC_RENDER, context, mountALL);
        dom = c.base;
        if (oldDom && dom !== oldDom) {
            // oldDom._component = null;
            recollectNodeTree(oldDom, false);
        }
    }
    return dom;
}
function unmountComponent(component) {
    if (options.beforeUnmount) {
        options.beforeUnmount(component);
    }
    var base = component.base;
    component._disable = true;
    if (component.componentWillUnmount) {
        component.componentWillUnmount();
    }
    component.base = undefined;
    var inner = component._component;
    var anyBase = base;
    if (inner) {
        unmountComponent(inner);
    }
    else if (anyBase && component.child) {
        if (component.child[ATTR_KEY] && component.child[ATTR_KEY].ref) {
            component.child[ATTR_KEY].ref(null);
        }
        // 卸载组件dom前把它存到nextBase
        component.nextBase = anyBase;
        // 从dom上移除
        removeNode(anyBase);
        // 放入全局缓存对象保存
        collectComponent(component);
        removeChildren(component.child);
    }
    if (component._ref) {
        component._ref(null);
    }
}
function removeDomChild(child) {
    child.base = null;
    child._component = null;
    child[ATTR_KEY] = null;
    child.event = null;
    child._listeners = null;
    child._componentConstructor = null;
    child.children = [];
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
        // 更新dom
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

var child = {};
/**
 * 创建组件到dom上
 * @param vnode jsx
 * @param parent 挂载的dom元素
 * @param merge 原dom元素
 */
function render(vnode, parent, merge, domChild) {
    var pchild = domChild || child;
    var base = diff(merge, vnode, {}, false, parent, false, pchild);
    if (pchild._component) {
        base._component = pchild._component;
    }
    return base;
}

function createClass(obj) {
    var cl = function (props, context) {
        Component.call(this, props, context, {});
    };
    obj = extend({ constructor: cl }, obj);
    if (obj.defaultProps) {
        cl.defaultProps = obj.defaultProps;
    }
    F.prototype = Component.prototype;
    cl.prototype = extend(new F(), obj);
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
    cloneElement: cloneElement,
    createClass: createClass,
    createElement: h,
    h: h,
    options: options,
    render: render,
    rerender: rerender,
};

export { Component, PureComponent, cloneElement, createClass, h as createElement, h, options, render, rerender };export default zreact;
//# sourceMappingURL=zreact.esm.js.map
