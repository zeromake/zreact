import PropTypes from "prop-types";
import { render as zreactRender, cloneElement as zreactCloneElement, h, Component as PreactComponent, options } from "zreact";

const version = "15.1.0"; // trick libraries to think we are react

const ELEMENTS = "a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr circle clipPath defs ellipse g image line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan".split(" ");

const REACT_ELEMENT_TYPE = (typeof Symbol !== "undefined" && (Symbol as any).for && (Symbol as any).for("react.element")) || 0xeac7;

const COMPONENT_WRAPPER_KEY = typeof Symbol !== "undefined" ? (Symbol as any).for("__zreactCompatWrapper") : "__zreactCompatWrapper";

// don"t autobind these methods since they already have guaranteed context.
const AUTOBIND_BLACKLIST = {
    componentDidMount: 1,
    componentDidUnmount: 1,
    componentDidUpdate: 1,
    componentWillMount: 1,
    componentWillReceiveProps: 1,
    componentWillUnmount: 1,
    componentWillUpdate: 1,
    constructor: 1,
    render: 1,
    shouldComponentUpdate: 1,
};

const CAMEL_PROPS = /^(?:accent|alignment|arabic|baseline|cap|clip|color|fill|flood|font|glyph|horiz|marker|overline|paint|stop|strikethrough|stroke|text|underline|unicode|units|v|vector|vert|word|writing|x)[A-Z]/;

const BYPASS_HOOK = {};

/*global process*/
const DEV = typeof process === "undefined" || !process.env || process.env.NODE_ENV !== "production";

// a component that renders nothing. Used to replace components for unmountComponentAtNode.
function EmptyComponent() { return null; }

// make react think we"re react.
const VNode = h("a", null).constructor;
VNode.prototype.$$typeof = REACT_ELEMENT_TYPE;
VNode.prototype.zreactCompatUpgraded = false;
VNode.prototype.zreactCompatNormalized = false;

Object.defineProperty(VNode.prototype, "type", {
    get() { return this.nodeName; },
    set(v) { this.nodeName = v; },
    configurable: true,
});

Object.defineProperty(VNode.prototype, "props", {
    get() { return this.attributes; },
    set(v) { this.attributes = v; },
    configurable: true,
});

const oldEventHook = options.event;
options.event = (e) => {
    if (oldEventHook) {
        e = oldEventHook(e);
    }
    (e as any).persist = Object;
    (e as any).nativeEvent = e;
    return e;
};

const oldVnodeHook = options.vnode;
options.vnode = (vnode) => {
    if (!vnode.zreactCompatUpgraded) {
        vnode.zreactCompatUpgraded = true;

        const tag = vnode.nodeName;
        const attrs = vnode.attributes = extend({}, vnode.attributes);

        if (typeof tag === "function") {
            if ((tag as any)[COMPONENT_WRAPPER_KEY] === true || (tag.prototype && "isReactComponent" in tag.prototype)) {
                if (vnode.children && String(vnode.children) === "") {
                    vnode.children = undefined;
                }
                if (vnode.children) {
                    attrs.children = vnode.children;
                }

                if (!vnode.zreactCompatNormalized) {
                    normalizeVNode(vnode);
                }
                handleComponentVNode(vnode);
            }
        } else {
            if (vnode.children && String(vnode.children) === "") {
                vnode.children = undefined;
            }
            if (vnode.children) {
                attrs.children = vnode.children;
            }

            if (attrs.defaultValue) {
                if (!attrs.value && attrs.value !== 0) {
                    attrs.value = attrs.defaultValue;
                }
                delete attrs.defaultValue;
            }

            handleElementVNode(vnode, attrs);
        }
    }

    if (oldVnodeHook) {
        oldVnodeHook(vnode);
    }
};

function handleComponentVNode(vnode: any) {
    const tag = vnode.nodeName;
    const a = vnode.attributes;

    vnode.attributes = {};
    if (tag.defaultProps) {
        extend(vnode.attributes, tag.defaultProps);
    }
    if (a) {
        extend(vnode.attributes, a);
    }
}

function handleElementVNode(vnode: any, a: any) {
    let shouldSanitize: boolean = false;
    let attrs: any;
    let i: string;
    if (a) {
        for (i in a) {
            if ((shouldSanitize = CAMEL_PROPS.test(i))) {
                break;
            }
        }
        if (shouldSanitize) {
            attrs = vnode.attributes = {};
            for (i in a) {
                if (a.hasOwnProperty(i)) {
                    attrs[ CAMEL_PROPS.test(i) ? i.replace(/([A-Z0-9])/, "-$1").toLowerCase() : i ] = a[i];
                }
            }
        }
    }
}

// proxy render() since React returns a Component reference.
function render(vnode: any, parent: any, callback?: () => void) {
    let prev = parent && parent._zreactCompatRendered && parent._zreactCompatRendered.vdom && parent._zreactCompatRendered.vdom.base;

    // ignore impossible previous renders
    if (prev && prev.parentNode !== parent) {
        prev = null;
    }

    // default to first Element child
    if (!prev && parent) {
        prev = parent.firstElementChild;
    }

    // remove unaffected siblings
    for (let i = parent.childNodes.length; i--; ) {
        if (parent.childNodes[i] !== prev) {
            parent.removeChild(parent.childNodes[i]);
        }
    }
    const out = zreactRender(vnode, parent, prev);
    if (parent) {
        parent._zreactCompatRendered = out && (((out as any)._vdom && (out as any)._vdom.component) || { base: out });
    }
    if (typeof callback === "function") {
        callback();
    }
    return out && (out as any)._vdom && (out as any)._vdom.component || out;
}

class ContextProvider {
    public props: any;
    public getChildContext() {
        return this.props.context;
    }
    public render(props: any) {
        return props.children[0];
    }
}

function renderSubtreeIntoContainer(parentComponent: any, vnode: any, container: any, callback: any) {
    const wrap = h(ContextProvider as any, { context: parentComponent.context }, vnode);
    const renderContainer = render(wrap, container);
    const component = renderContainer._component || (renderContainer.vdom && renderContainer.vdom.base);
    if (callback) {
        callback.call(component, renderContainer);
    }
    return component;
}

function unmountComponentAtNode(container: any) {
    const existing = container._zreactCompatRendered && container._zreactCompatRendered.vdom && container._zreactCompatRendered.vdom.base;
    if (existing && existing.parentNode === container) {
        zreactRender(h(EmptyComponent as any, null), container, existing);
        return true;
    }
    return false;
}

const ARR: any[] = [];

// This API is completely unnecessary for Preact, so it"s basically passthrough.
const Children = {
    map(children: any, fn: any, ctx: any) {
        if (children == null) {
            return null;
        }
        children = Children.toArray(children);
        if (ctx && ctx !== children) {
            fn = fn.bind(ctx);
        }
        return children.map(fn);
    },
    forEach(children: any, fn: any, ctx: any) {
        if (children == null) {
            return null;
        }
        children = Children.toArray(children);
        if (ctx && ctx !== children) {
            fn = fn.bind(ctx);
        }
        children.forEach(fn);
    },
    count(children: any) {
        return children && children.length || 0;
    },
    only(children: any) {
        children = Children.toArray(children);
        if (children.length !== 1) {
            throw new Error("Children.only() expects only one child.");
        }
        return children[0];
    },
    toArray(children: any) {
        if (children == null) {
            return [];
        }
        return ARR.concat(children);
    },
};

/** Track current render() component for ref assignment */
let currentComponent: any;

function createFactory(type: any) {
    return createElement.bind(null, type);
}

const DOM: any = {};
for (let i = ELEMENTS.length; i--; ) {
    DOM[ELEMENTS[i]] = createFactory(ELEMENTS[i]);
}

function upgradeToVNodes(arr: any, offset?: number) {
    for (let i = offset || 0; i < arr.length; i++) {
        const obj = arr[i];
        if (Array.isArray(obj)) {
            upgradeToVNodes(obj);
        } else if (obj && typeof obj === "object" && !isValidElement(obj) && ((obj.props && obj.type) || (obj.attributes && obj.nodeName) || obj.children)) {
            arr[i] = createElement(obj.type || obj.nodeName, obj.props || obj.attributes, obj.children);
        }
    }
}

function isStatelessComponent(c: any) {
    return typeof c === "function" && !(c.prototype && c.prototype.render);
}

// wraps stateless functional components in a PropTypes validator
function wrapStatelessComponent(WrappedComponent: any) {
    return createClass({
        displayName: WrappedComponent.displayName || WrappedComponent.name,
        render() {
            return WrappedComponent(this.props, this.context);
        },
    });
}

function statelessComponentHook(Ctor: any) {
    let Wrapped = Ctor[COMPONENT_WRAPPER_KEY];
    if (Wrapped) {
        return Wrapped === true ? Ctor : Wrapped;
    }

    Wrapped = wrapStatelessComponent(Ctor);

    Object.defineProperty(Wrapped, COMPONENT_WRAPPER_KEY, { configurable: true, value: true });
    Wrapped.displayName = Ctor.displayName;
    Wrapped.propTypes = Ctor.propTypes;
    Wrapped.defaultProps = Ctor.defaultProps;

    Object.defineProperty(Ctor, COMPONENT_WRAPPER_KEY, { configurable: true, value: Wrapped });

    return Wrapped;
}

function createElement(...args: any[]) {
    upgradeToVNodes(args, 2);
    return normalizeVNode(h.apply(void 0, args));
}

function normalizeVNode(vnode: any) {
    vnode.zreactCompatNormalized = true;

    applyClassName(vnode);

    if (isStatelessComponent(vnode.nodeName)) {
        vnode.nodeName = statelessComponentHook(vnode.nodeName);
    }

    const ref = vnode.attributes.ref;
    const type = ref && typeof ref;
    if (currentComponent && (type === "string" || type === "number")) {
        vnode.attributes.ref = createStringRefProxy(ref, currentComponent);
    }

    applyEventNormalization(vnode);

    return vnode;
}

function cloneElement(element: any, props: any, ...children: any[]) {
    if (!isValidElement(element)) {
        return element;
    }
    const elementProps = element.attributes || element.props;
    const node = h(
        element.nodeName || element.type,
        elementProps,
        element.children || elementProps && elementProps.children,
    );
    // Only provide the 3rd argument if needed.
    // Arguments 3+ overwrite element.children in preactCloneElement
    const cloneArgs = [node, props];
    if (children && children.length) {
        cloneArgs.push(children);
    } else if (props && props.children) {
        cloneArgs.push(props.children);
    }
    return normalizeVNode(zreactCloneElement.apply(void 0, cloneArgs));
}

function isValidElement(element: any) {
    return element && ((element instanceof VNode) || element.$$typeof === REACT_ELEMENT_TYPE);
}

function createStringRefProxy(name: any, component: any) {
    return component._refProxies[name] || (component._refProxies[name] = (resolved: any) => {
        if (component && component.refs) {
            component.refs[name] = resolved;
            if (resolved === null) {
                delete component._refProxies[name];
                component = null;
            }
        }
    });
}

function applyEventNormalization({ nodeName, attributes }: any) {
    if (!attributes || typeof nodeName !== "string") {
        return;
    }
    const props: any = {};
    for (const i in attributes) {
        props[i.toLowerCase()] = i;
    }
    if (props.ondoubleclick) {
        attributes.ondblclick = attributes[props.ondoubleclick];
        delete attributes[props.ondoubleclick];
    }
    // for *textual inputs* (incl textarea), normalize `onChange` -> `onInput`:
    if (props.onchange && (nodeName === "textarea" || (nodeName.toLowerCase() === "input" && !/^fil|che|rad/i.test(attributes.type)))) {
        const normalized = props.oninput || "oninput";
        if (!attributes[normalized]) {
            attributes[normalized] = multihook([attributes[normalized], attributes[props.onchange]]);
            delete attributes[props.onchange];
        }
    }
}

function applyClassName(vnode: any) {
    const a = vnode.attributes || (vnode.attributes = {});
    (classNameDescriptor as any).enumerable = "className" in a;
    if (a.className) {
        a.class = a.className;
    }
    Object.defineProperty(a, "className", classNameDescriptor);
}

const classNameDescriptor = {
    configurable: true,
    get() { return this.class; },
    set(v: any) { this.class = v; },
} as any;

function extend(base: any, props: any) {
    for (let i = 1, obj; i < arguments.length; i++) {
        if ((obj = arguments[i])) {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    base[key] = obj[key];
                }
            }
        }
    }
    return base;
}

function shallowDiffers(a: any, b: any) {
    for (const i in a) {
        if (!(i in b)) {
            return true;
        }
    }
    for (const i in b) {
        if (a[i] !== b[i]) {
            return true;
        }
    }
    return false;
}

function findDOMNode(component: any) {
    return component && component.vdom && component.vdom.base || component;
}

function F() {}

function createClass(obj: any) {
    function cl(this: any, props: any, context: any) {
        bindAll(this);
        Component.call(this, props, context, BYPASS_HOOK);
        newComponentHook.call(this, props, context);
    }

    obj = extend({ constructor: cl }, obj);

    // We need to apply mixins here so that getDefaultProps is correctly mixed
    if (obj.mixins) {
        applyMixins(obj, collateMixins(obj.mixins));
    }
    if (obj.statics) {
        extend(cl, obj.statics);
    }
    if (obj.propTypes) {
        (cl as any).propTypes = obj.propTypes;
    }
    if (obj.defaultProps) {
        (cl as any).defaultProps = obj.defaultProps;
    }
    if (obj.getDefaultProps) {
        (cl as any).defaultProps = obj.getDefaultProps();
    }

    F.prototype = Component.prototype;
    cl.prototype = extend(new (F as any)(), obj);

    (cl as any).displayName = obj.displayName || "Component";

    return cl;
}

// Flatten an Array of mixins to a map of method name to mixin implementations
function collateMixins(mixins: any) {
    const keyed: any = {};
    for (const mixin of mixins) {
        for (const key in mixin) {
            if (mixin.hasOwnProperty(key) && typeof mixin[key] === "function") {
                (keyed[key] || (keyed[key] = [])).push(mixin[key]);
            }
        }
    }
    return keyed;
}

// apply a mapping of Arrays of mixin methods to a component prototype
function applyMixins(proto: any, mixins: any) {
    for (const key in mixins) {
        if (mixins.hasOwnProperty(key)) {
            proto[key] = multihook(
                mixins[key].concat(proto[key] || ARR),
                key === "getDefaultProps" || key === "getInitialState" || key === "getChildContext",
            );
        }
    }
}

function bindAll(ctx: any) {
    for (const i in ctx) {
        const v = ctx[i];
        if (typeof v === "function" && !v.__bound && !AUTOBIND_BLACKLIST.hasOwnProperty(i)) {
            (ctx[i] = v.bind(ctx)).__bound = true;
        }
    }
}

function callMethod(ctx: any, m: any, args: any) {
    if (typeof m === "string") {
        m = ctx.constructor.prototype[m];
    }
    if (typeof m === "function") {
        return m.apply(ctx, args);
    }
}

function multihook(hooks: any, skipDuplicates?: boolean) {
    return function(this: any) {
        let ret;
        for (const hook of hooks) {
            const r = callMethod(this, hook, arguments);

            if (skipDuplicates && r != null) {
                if (!ret) {
                    ret = {};
                }
                for (const key in r) {
                    if (r.hasOwnProperty(key)) {
                        ret[key] = r[key];
                    }
                }
            } else if (typeof r !== "undefined") {
                ret = r;
            }
        }
        return ret;
    };
}

function newComponentHook(this: any, props: any, context: any) {
    propsHook.call(this, props, context);
    this.componentWillReceiveProps = multihook([propsHook, this.componentWillReceiveProps || "componentWillReceiveProps"]);
    this.render = multihook([propsHook, beforeRender, this.render || "render", afterRender]);
}

function propsHook(this: any, props: any, context: any) {
    if (!props) {
        return;
    }

    // React annoyingly special-cases single children, and some react components are ridiculously strict about this.
    const c = props.children;
    if (c && Array.isArray(c) && c.length === 1 && (typeof c[0] === "string" || typeof c[0] === "function" || c[0] instanceof VNode)) {
        props.children = c[0];

        // but its totally still going to be an Array.
        if (props.children && typeof props.children === "object") {
            props.children.length = 1;
            props.children[0] = props.children;
        }
    }

    // add proptype checking
    if (DEV) {
        const ctor = typeof this === "function" ? this : this.constructor;
        const propTypes = this.propTypes || ctor.propTypes;
        const displayName = this.displayName || ctor.name;

        if (propTypes) {
            PropTypes.checkPropTypes(propTypes, props, "prop", displayName);
        }
    }
}

function beforeRender(this: any, props: any) {
    currentComponent = this;
}

function afterRender(this: any) {
    if (currentComponent === this) {
        currentComponent = null;
    }
}

function Component(this: any, props: any, context: any, opts: any) {
    PreactComponent.call(this, props, context);
    this.state = this.getInitialState ? this.getInitialState() : {};
    this.refs = {};
    this._refProxies = {};
    if (opts !== BYPASS_HOOK) {
        newComponentHook.call(this, props, context);
    }
}
extend(Component.prototype = new PreactComponent<any, any>({}, {}), {
    constructor: Component,

    isReactComponent: {},

    replaceState(state: any, callback: any) {
        this.setState(state, callback);
        for (const i in this.state) {
            if (!(i in state)) {
                delete this.state[i];
            }
        }
    },

    getDOMNode() {
        return this.vdom && this.vdom.base;
    },
    isMounted() {
        return !!(this.vdom && this.vdom.base);
    },
});

function PureComponent(this: any, props: any, context: any) {
    Component.call(this, props, context);
}
F.prototype = Component.prototype;
PureComponent.prototype = new (F as any)();
PureComponent.prototype.isPureReactComponent = true;
PureComponent.prototype.shouldComponentUpdate = function(props: any, state: any) {
    return shallowDiffers(this.props, props) || shallowDiffers(this.state, state);
};

export {
    version,
    DOM,
    PropTypes,
    Children,
    render,
    createClass,
    createFactory,
    createElement,
    cloneElement,
    isValidElement,
    findDOMNode,
    unmountComponentAtNode,
    Component,
    PureComponent,
    renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer,
    // this is a really old hidden react api, but something out there uses it
    // https://twitter.com/Joseph_Wynn/status/888046593286574085
    extend as __spread,
};

export default {
    version,
    DOM,
    PropTypes,
    Children,
    render,
    createClass,
    createFactory,
    createElement,
    cloneElement,
    isValidElement,
    findDOMNode,
    unmountComponentAtNode,
    Component,
    PureComponent,
    unstable_renderSubtreeIntoContainer: renderSubtreeIntoContainer,
    __spread: extend,
};
