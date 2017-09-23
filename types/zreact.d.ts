declare namespace $private {
    interface IKeyValue {
        [name: string]: any;
    }
    interface IEventFun {
        [name: string]: (e: Event) => void;
    }
    interface IVDom {
        /**
         * dom所属的顶级Component
         */
        component?: zreact.Component<IKeyValue, IKeyValue>;
        /**
         * 子组件
         */
        children?: IVDom[];
        /**
         * 真实dom索引
         */
        base: Element | Text | Node;
        /**
         * 每种事件的代理方法存放点, 真实绑定到dom上的方法。
         */
        eventProxy?: {
            [name: string]: ((e: Event) => void) | undefined;
        };
        /**
         * dom所属的props
         */
        props?: IKeyValue | boolean;
        /**
         * 通过props设置的事件方法, 通过eventProxy来调用, 保证在不停的props变化时不会一直绑定与解绑。
         */
        listeners?: IEventFun;
        /**
         * dom标签名
         */
        normalizedNodeName?: string;
        parent?: IVDom;
        /**
         * component类(原型)
         */
        componentConstructor?: any;
    }
    type funComponent = (props?: IKeyValue, content?: any) => zreact.VNode;
    type childType = zreact.VNode | string | number | boolean;
}
declare namespace zreact {
    interface DangerouslySetInnerHTML {
	 __html: string;
	}

	interface PreactHTMLAttributes {
		dangerouslySetInnerHTML?:DangerouslySetInnerHTML;
		key?:string;
		ref?:(el?: Element) => void;
	}
    interface VNode {
        /**
         * 组件名
         * {string} 为原生组件
         * {Component|function} 为自定义组件
         */
        nodeName: string | typeof zreact.Component;
        /**
         * 子组件
         */
        children: Array<string | number | boolean | VNode>;
        /**
         * 组件所属的属性
         */
        attributes?: $private.IKeyValue;
        /**
         * 属性中的key
         */
        key?: string | number;
    }
    class Component<PropsType extends $private.IKeyValue, StateType extends $private.IKeyValue> {
        /**
         * 默认props
         */
        static defaultProps?: $private.IKeyValue;
        /**
         * 当前组件的状态,可以修改
         */
        state: StateType;
        /**
         * 由父级组件传递的状态，不可修改
         */
        props: PropsType;
        /**
         * 组件上下文，由父组件传递
         */
        context: $private.IKeyValue;
        /**
         * 组件挂载后的vdom
         */
        vdom?: $private.IVDom;
        /**
         * 被移除时的vdom缓存
         */
        nextVDom?: $private.IVDom;
        /**
         * 自定义组件名
         */
        name?: string;
        /**
         * 上一次的属性
         */
        prevProps?: PropsType;
        /**
         * 上一次的状态
         */
        prevState?: StateType;
        /**
         * 上一次的上下文
         */
        prevContext?: $private.IKeyValue;
        /**
         * 在一个组件被渲染到 DOM 之前
         */
        componentWillMount?: () => void;
        /**
         * 在一个组件被渲染到 DOM 之后
         */
        componentDidMount?: () => void;
        /**
         * 在一个组件在 DOM 中被清除之前
         */
        componentWillUnmount?: () => void;
        /**
         * 在新的 props 被接受之前
         * @param { PropsType } nextProps
         * @param { IKeyValue } nextContext
         */
        componentWillReceiveProps?: (nextProps: PropsType, nextContext: $private.IKeyValue) => void;
        /**
         * 在 render() 之前. 若返回 false，则跳过 render，与 componentWillUpdate 互斥
         * @param { PropsType } nextProps
         * @param { StateType } nextState
         * @param { IKeyValue } nextContext
         * @returns { boolean }
         */
        shouldComponentUpdate?: (nextProps: PropsType, nextState: StateType, nextContext: $private.IKeyValue) => boolean;
        /**
         * 在 render() 之前，与 shouldComponentUpdate 互斥
         * @param { PropsType } nextProps
         * @param { StateType } nextState
         * @param { IKeyValue } nextContext
         */
        componentWillUpdate?: (nextProps: PropsType, nextState: StateType, nextContext: $private.IKeyValue) => void;
        /**
         * 在 render() 之后
         * @param { PropsType } previousProps
         * @param { StateType } previousState
         * @param { IKeyValue } previousContext
         */
        componentDidUpdate?: (previousProps: PropsType, previousState: StateType, previousContext: $private.IKeyValue) => void;
        /**
         * 获取上下文，会被传递到所有的子组件
         */
        getChildContext?: () => $private.IKeyValue;
        /**
         * 子组件
         */
        _component?: Component<$private.IKeyValue, $private.IKeyValue>;
        /**
         * 父组件
         */
        _parentComponent?: Component<$private.IKeyValue, $private.IKeyValue>;
        /**
         * 是否加入更新队列
         */
        _dirty: boolean;
        /**
         * render 执行完后的回调队列
         */
        _renderCallbacks?: Array<() => void>;
        /**
         * 当前组件的key用于复用
         */
        _key?: string;
        /**
         * 是否停用
         */
        _disable?: boolean;
        /**
         * react标准用于设置component实例
         */
        _ref?: (component: Component<PropsType, StateType> | null) => void;
        constructor(props: PropsType, context: $private.IKeyValue);
        /**
         * 设置state并通过enqueueRender异步更新dom
         * @param state 对象或方法
         * @param callback render执行完后的回调。
         */
        setState(state: StateType, callback?: () => void): void;
        /**
         * 手动的同步更新dom
         * @param callback 回调
         */
        forceUpdate(callback: () => void): void;
        /**
         * 用来生成VNode的函数，一定要继承后覆盖
         * @param props
         * @param state
         * @param context
         */
        render(props: PropsType, state: StateType, context: $private.IKeyValue, createElement: typeof h): VNode | void;
        /**
         * 触发props上的on开头的方法，并以_emitComponent为this, 仅支持一个参数传入
         * @param eventName 事件名去除
         * @param args 传递的参数
         */
        $emit(eventName: string, args: any): any;
    }
    // class PureComponent<PropsType extends $private.IKeyValue, StateType extends $private.IKeyValue> extends Component<PropsType, StateType> {
    //     isPureReactComponent: boolean;
    //     shouldComponentUpdate: (props: PropsType, state: StateType) => boolean;
    // }
    function cloneElement(vnode: VNode, props: any, ...children: any[]): VNode;
    function rerender(): void;
    interface option {
        /**
         * render更新后钩子比componentDidUpdate更后面执行
         */
        afterUpdate?: (component: Component<$private.IKeyValue, $private.IKeyValue>) => void;
        /**
         * dom卸载载前钩子比componentWillUnmount更先执行
         */
        beforeUnmount?: (component: Component<$private.IKeyValue, $private.IKeyValue>) => void;
        /**
         * dom挂载后钩子比componentDidMount更先执行
         */
        afterMount?: (component: Component<$private.IKeyValue, $private.IKeyValue>) => void;
        /**
         * setComponentProps时强制为同步render
         */
        syncComponentUpdates?: boolean;
        /**
         * 自定义异步调度方法，会异步执行传入的方法
         */
        debounceRendering?: (render: () => void) => void;
        /**
         * vnode实例创建时的钩子
         */
        vnode?: (vnode: VNode) => void;
        /**
         * 事件钩子，可以对event过滤返回的会代替event参数
         */
        event?: (event: Event) => any;
        /**
         * 是否自动对事件方法绑定this为组件，默认为true(preact没有)
         */
        eventBind?: boolean;
    }
    function render(vnode: VNode, parent: Element | Node, dom?: Element | Text | Node): Element | Text | Node;
    function h(this: Component<$private.IKeyValue, $private.IKeyValue> | undefined | void | null, nodeName: string | typeof Component | $private.funComponent, attributes: $private.IKeyValue, ...args: $private.childType[]): VNode;
    function createElement(this: Component<$private.IKeyValue, $private.IKeyValue> | undefined | void | null, nodeName: string | typeof Component | $private.funComponent, attributes: $private.IKeyValue, ...args: $private.childType[]): VNode;
    // function createClass(obj: any): any;
}
declare module "zreact" {
	export = zreact;
}
declare namespace JSX {
	interface Element extends zreact.VNode {
	}

	interface ElementClass extends zreact.Component<$private.IKeyValue, $private.IKeyValue> {
	}

	interface ElementAttributesProperty {
		props:any;
	}

	interface SVGAttributes extends HTMLAttributes {
		accentHeight?:number | string;
		accumulate?:"none" | "sum";
		additive?:"replace" | "sum";
		alignmentBaseline?:"auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" | "text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
		allowReorder?:"no" | "yes";
		alphabetic?:number | string;
		amplitude?:number | string;
		arabicForm?:"initial" | "medial" | "terminal" | "isolated";
		ascent?:number | string;
		attributeName?:string;
		attributeType?:string;
		autoReverse?:number | string;
		azimuth?:number | string;
		baseFrequency?:number | string;
		baselineShift?:number | string;
		baseProfile?:number | string;
		bbox?:number | string;
		begin?:number | string;
		bias?:number | string;
		by?:number | string;
		calcMode?:number | string;
		capHeight?:number | string;
		clip?:number | string;
		clipPath?:string;
		clipPathUnits?:number | string;
		clipRule?:number | string;
		colorInterpolation?:number | string;
		colorInterpolationFilters?:"auto" | "sRGB" | "linearRGB" | "inherit";
		colorProfile?:number | string;
		colorRendering?:number | string;
		contentScriptType?:number | string;
		contentStyleType?:number | string;
		cursor?:number | string;
		cx?:number | string;
		cy?:number | string;
		d?:string;
		decelerate?:number | string;
		descent?:number | string;
		diffuseConstant?:number | string;
		direction?:number | string;
		display?:number | string;
		divisor?:number | string;
		dominantBaseline?:number | string;
		dur?:number | string;
		dx?:number | string;
		dy?:number | string;
		edgeMode?:number | string;
		elevation?:number | string;
		enableBackground?:number | string;
		end?:number | string;
		exponent?:number | string;
		externalResourcesRequired?:number | string;
		fill?:string;
		fillOpacity?:number | string;
		fillRule?:"nonzero" | "evenodd" | "inherit";
		filter?:string;
		filterRes?:number | string;
		filterUnits?:number | string;
		floodColor?:number | string;
		floodOpacity?:number | string;
		focusable?:number | string;
		fontFamily?:string;
		fontSize?:number | string;
		fontSizeAdjust?:number | string;
		fontStretch?:number | string;
		fontStyle?:number | string;
		fontVariant?:number | string;
		fontWeight?:number | string;
		format?:number | string;
		from?:number | string;
		fx?:number | string;
		fy?:number | string;
		g1?:number | string;
		g2?:number | string;
		glyphName?:number | string;
		glyphOrientationHorizontal?:number | string;
		glyphOrientationVertical?:number | string;
		glyphRef?:number | string;
		gradientTransform?:string;
		gradientUnits?:string;
		hanging?:number | string;
		horizAdvX?:number | string;
		horizOriginX?:number | string;
		ideographic?:number | string;
		imageRendering?:number | string;
		in2?:number | string;
		in?:string;
		intercept?:number | string;
		k1?:number | string;
		k2?:number | string;
		k3?:number | string;
		k4?:number | string;
		k?:number | string;
		kernelMatrix?:number | string;
		kernelUnitLength?:number | string;
		kerning?:number | string;
		keyPoints?:number | string;
		keySplines?:number | string;
		keyTimes?:number | string;
		lengthAdjust?:number | string;
		letterSpacing?:number | string;
		lightingColor?:number | string;
		limitingConeAngle?:number | string;
		local?:number | string;
		markerEnd?:string;
		markerHeight?:number | string;
		markerMid?:string;
		markerStart?:string;
		markerUnits?:number | string;
		markerWidth?:number | string;
		mask?:string;
		maskContentUnits?:number | string;
		maskUnits?:number | string;
		mathematical?:number | string;
		mode?:number | string;
		numOctaves?:number | string;
		offset?:number | string;
		opacity?:number | string;
		operator?:number | string;
		order?:number | string;
		orient?:number | string;
		orientation?:number | string;
		origin?:number | string;
		overflow?:number | string;
		overlinePosition?:number | string;
		overlineThickness?:number | string;
		paintOrder?:number | string;
		panose1?:number | string;
		pathLength?:number | string;
		patternContentUnits?:string;
		patternTransform?:number | string;
		patternUnits?:string;
		pointerEvents?:number | string;
		points?:string;
		pointsAtX?:number | string;
		pointsAtY?:number | string;
		pointsAtZ?:number | string;
		preserveAlpha?:number | string;
		preserveAspectRatio?:string;
		primitiveUnits?:number | string;
		r?:number | string;
		radius?:number | string;
		refX?:number | string;
		refY?:number | string;
		renderingIntent?:number | string;
		repeatCount?:number | string;
		repeatDur?:number | string;
		requiredExtensions?:number | string;
		requiredFeatures?:number | string;
		restart?:number | string;
		result?:string;
		rotate?:number | string;
		rx?:number | string;
		ry?:number | string;
		scale?:number | string;
		seed?:number | string;
		shapeRendering?:number | string;
		slope?:number | string;
		spacing?:number | string;
		specularConstant?:number | string;
		specularExponent?:number | string;
		speed?:number | string;
		spreadMethod?:string;
		startOffset?:number | string;
		stdDeviation?:number | string;
		stemh?:number | string;
		stemv?:number | string;
		stitchTiles?:number | string;
		stopColor?:string;
		stopOpacity?:number | string;
		strikethroughPosition?:number | string;
		strikethroughThickness?:number | string;
		string?:number | string;
		stroke?:string;
		strokeDasharray?:string | number;
		strokeDashoffset?:string | number;
		strokeLinecap?:"butt" | "round" | "square" | "inherit";
		strokeLinejoin?:"miter" | "round" | "bevel" | "inherit";
		strokeMiterlimit?:string;
		strokeOpacity?:number | string;
		strokeWidth?:number | string;
		surfaceScale?:number | string;
		systemLanguage?:number | string;
		tableValues?:number | string;
		targetX?:number | string;
		targetY?:number | string;
		textAnchor?:string;
		textDecoration?:number | string;
		textLength?:number | string;
		textRendering?:number | string;
		to?:number | string;
		transform?:string;
		u1?:number | string;
		u2?:number | string;
		underlinePosition?:number | string;
		underlineThickness?:number | string;
		unicode?:number | string;
		unicodeBidi?:number | string;
		unicodeRange?:number | string;
		unitsPerEm?:number | string;
		vAlphabetic?:number | string;
		values?:string;
		vectorEffect?:number | string;
		version?:string;
		vertAdvY?:number | string;
		vertOriginX?:number | string;
		vertOriginY?:number | string;
		vHanging?:number | string;
		vIdeographic?:number | string;
		viewBox?:string;
		viewTarget?:number | string;
		visibility?:number | string;
		vMathematical?:number | string;
		widths?:number | string;
		wordSpacing?:number | string;
		writingMode?:number | string;
		x1?:number | string;
		x2?:number | string;
		x?:number | string;
		xChannelSelector?:string;
		xHeight?:number | string;
		xlinkActuate?:string;
		xlinkArcrole?:string;
		xlinkHref?:string;
		xlinkRole?:string;
		xlinkShow?:string;
		xlinkTitle?:string;
		xlinkType?:string;
		xmlBase?:string;
		xmlLang?:string;
		xmlns?:string;
		xmlnsXlink?:string;
		xmlSpace?:string;
		y1?:number | string;
		y2?:number | string;
		y?:number | string;
		yChannelSelector?:string;
		z?:number | string;
		zoomAndPan?:string;
	}

	interface PathAttributes {
		d:string;
	}

	interface EventHandler<E extends Event> {
		(event:E):void;
	}

	type ClipboardEventHandler = EventHandler<ClipboardEvent>;
	type CompositionEventHandler = EventHandler<CompositionEvent>;
	type DragEventHandler = EventHandler<DragEvent>;
	type FocusEventHandler = EventHandler<FocusEvent>;
	type KeyboardEventHandler = EventHandler<KeyboardEvent>;
	type MouseEventHandler = EventHandler<MouseEvent>;
	type TouchEventHandler = EventHandler<TouchEvent>;
	type UIEventHandler = EventHandler<UIEvent>;
	type WheelEventHandler = EventHandler<WheelEvent>;
	type AnimationEventHandler = EventHandler<AnimationEvent>;
	type TransitionEventHandler = EventHandler<TransitionEvent>;
	type GenericEventHandler = EventHandler<Event>;

	interface DOMAttributes {
		// Image Events
		onLoad?:GenericEventHandler;

		// Clipboard Events
		onCopy?:ClipboardEventHandler;
		onCut?:ClipboardEventHandler;
		onPaste?:ClipboardEventHandler;

		// Composition Events
		onCompositionEnd?:CompositionEventHandler;
		onCompositionStart?:CompositionEventHandler;
		onCompositionUpdate?:CompositionEventHandler;

		// Focus Events
		onFocus?:FocusEventHandler;
		onBlur?:FocusEventHandler;

		// Form Events
		onChange?:GenericEventHandler;
		onInput?:GenericEventHandler;
		onSearch?:GenericEventHandler;
		onSubmit?:GenericEventHandler;

		// Keyboard Events
		onKeyDown?:KeyboardEventHandler;
		onKeyPress?:KeyboardEventHandler;
		onKeyUp?:KeyboardEventHandler;

		// Media Events
		onAbort?:GenericEventHandler;
		onCanPlay?:GenericEventHandler;
		onCanPlayThrough?:GenericEventHandler;
		onDurationChange?:GenericEventHandler;
		onEmptied?:GenericEventHandler;
		onEncrypted?:GenericEventHandler;
		onEnded?:GenericEventHandler;
		onLoadedData?:GenericEventHandler;
		onLoadedMetadata?:GenericEventHandler;
		onLoadStart?:GenericEventHandler;
		onPause?:GenericEventHandler;
		onPlay?:GenericEventHandler;
		onPlaying?:GenericEventHandler;
		onProgress?:GenericEventHandler;
		onRateChange?:GenericEventHandler;
		onSeeked?:GenericEventHandler;
		onSeeking?:GenericEventHandler;
		onStalled?:GenericEventHandler;
		onSuspend?:GenericEventHandler;
		onTimeUpdate?:GenericEventHandler;
		onVolumeChange?:GenericEventHandler;
		onWaiting?:GenericEventHandler;

		// MouseEvents
		onClick?:MouseEventHandler;
		onContextMenu?:MouseEventHandler;
		onDblClick?: MouseEventHandler;
		onDrag?:DragEventHandler;
		onDragEnd?:DragEventHandler;
		onDragEnter?:DragEventHandler;
		onDragExit?:DragEventHandler;
		onDragLeave?:DragEventHandler;
		onDragOver?:DragEventHandler;
		onDragStart?:DragEventHandler;
		onDrop?:DragEventHandler;
		onMouseDown?:MouseEventHandler;
		onMouseEnter?:MouseEventHandler;
		onMouseLeave?:MouseEventHandler;
		onMouseMove?:MouseEventHandler;
		onMouseOut?:MouseEventHandler;
		onMouseOver?:MouseEventHandler;
		onMouseUp?:MouseEventHandler;

		// Selection Events
		onSelect?:GenericEventHandler;

		// Touch Events
		onTouchCancel?:TouchEventHandler;
		onTouchEnd?:TouchEventHandler;
		onTouchMove?:TouchEventHandler;
		onTouchStart?:TouchEventHandler;

		// UI Events
		onScroll?:UIEventHandler;

		// Wheel Events
		onWheel?:WheelEventHandler;

		// Animation Events
		onAnimationStart?:AnimationEventHandler;
		onAnimationEnd?:AnimationEventHandler;
		onAnimationIteration?:AnimationEventHandler;

		// Transition Events
		onTransitionEnd?:TransitionEventHandler;
	}

	interface HTMLAttributes extends zreact.PreactHTMLAttributes, DOMAttributes {
		// Standard HTML Attributes
		accept?:string;
		acceptCharset?:string;
		accessKey?:string;
		action?:string;
		allowFullScreen?:boolean;
		allowTransparency?:boolean;
		alt?:string;
		async?:boolean;
		autocomplete?:string;
		autofocus?:boolean;
		autoPlay?:boolean;
		capture?:boolean;
		cellPadding?:number | string;
		cellSpacing?:number | string;
		charSet?:string;
		challenge?:string;
		checked?:boolean;
		class?:string | { [key:string]: boolean };
		className?:string | { [key:string]: boolean };
		cols?:number;
		colSpan?:number;
		content?:string;
		contentEditable?:boolean;
		contextMenu?:string;
		controls?:boolean;
		coords?:string;
		crossOrigin?:string;
		data?:string;
		dateTime?:string;
		default?:boolean;
		defer?:boolean;
		dir?:string;
		disabled?:boolean;
		download?:any;
		draggable?:boolean;
		encType?:string;
		form?:string;
		formAction?:string;
		formEncType?:string;
		formMethod?:string;
		formNoValidate?:boolean;
		formTarget?:string;
		frameBorder?:number | string;
		headers?:string;
		height?:number | string;
		hidden?:boolean;
		high?:number;
		href?:string;
		hrefLang?:string;
		for?:string;
		httpEquiv?:string;
		icon?:string;
		id?:string;
		inputMode?:string;
		integrity?:string;
		is?:string;
		keyParams?:string;
		keyType?:string;
		kind?:string;
		label?:string;
		lang?:string;
		list?:string;
		loop?:boolean;
		low?:number;
		manifest?:string;
		marginHeight?:number;
		marginWidth?:number;
		max?:number | string;
		maxLength?:number;
		media?:string;
		mediaGroup?:string;
		method?:string;
		min?:number | string;
		minLength?:number;
		multiple?:boolean;
		muted?:boolean;
		name?:string;
		noValidate?:boolean;
		open?:boolean;
		optimum?:number;
		pattern?:string;
		placeholder?:string;
		poster?:string;
		preload?:string;
		radioGroup?:string;
		readOnly?:boolean;
		rel?:string;
		required?:boolean;
		role?:string;
		rows?:number;
		rowSpan?:number;
		sandbox?:string;
		scope?:string;
		scoped?:boolean;
		scrolling?:string;
		seamless?:boolean;
		selected?:boolean;
		shape?:string;
		size?:number;
		sizes?:string;
		slot?:string;
		span?:number;
		spellCheck?:boolean;
		src?:string;
		srcset?:string;
		srcDoc?:string;
		srcLang?:string;
		srcSet?:string;
		start?:number;
		step?:number | string;
		style?:any;
		summary?:string;
		tabIndex?:number;
		target?:string;
		title?:string;
		type?:string;
		useMap?:string;
		value?:string | string[];
		width?:number | string;
		wmode?:string;
		wrap?:string;

		// RDFa Attributes
		about?:string;
		datatype?:string;
		inlist?:any;
		prefix?:string;
		property?:string;
		resource?:string;
		typeof?:string;
		vocab?:string;
	}

	interface IntrinsicElements {
		// HTML
		a:HTMLAttributes;
		abbr:HTMLAttributes;
		address:HTMLAttributes;
		area:HTMLAttributes;
		article:HTMLAttributes;
		aside:HTMLAttributes;
		audio:HTMLAttributes;
		b:HTMLAttributes;
		base:HTMLAttributes;
		bdi:HTMLAttributes;
		bdo:HTMLAttributes;
		big:HTMLAttributes;
		blockquote:HTMLAttributes;
		body:HTMLAttributes;
		br:HTMLAttributes;
		button:HTMLAttributes;
		canvas:HTMLAttributes;
		caption:HTMLAttributes;
		cite:HTMLAttributes;
		code:HTMLAttributes;
		col:HTMLAttributes;
		colgroup:HTMLAttributes;
		data:HTMLAttributes;
		datalist:HTMLAttributes;
		dd:HTMLAttributes;
		del:HTMLAttributes;
		details:HTMLAttributes;
		dfn:HTMLAttributes;
		dialog:HTMLAttributes;
		div:HTMLAttributes;
		dl:HTMLAttributes;
		dt:HTMLAttributes;
		em:HTMLAttributes;
		embed:HTMLAttributes;
		fieldset:HTMLAttributes;
		figcaption:HTMLAttributes;
		figure:HTMLAttributes;
		footer:HTMLAttributes;
		form:HTMLAttributes;
		h1:HTMLAttributes;
		h2:HTMLAttributes;
		h3:HTMLAttributes;
		h4:HTMLAttributes;
		h5:HTMLAttributes;
		h6:HTMLAttributes;
		head:HTMLAttributes;
		header:HTMLAttributes;
		hr:HTMLAttributes;
		html:HTMLAttributes;
		i:HTMLAttributes;
		iframe:HTMLAttributes;
		img:HTMLAttributes;
		input:HTMLAttributes;
		ins:HTMLAttributes;
		kbd:HTMLAttributes;
		keygen:HTMLAttributes;
		label:HTMLAttributes;
		legend:HTMLAttributes;
		li:HTMLAttributes;
		link:HTMLAttributes;
		main:HTMLAttributes;
		map:HTMLAttributes;
		mark:HTMLAttributes;
		menu:HTMLAttributes;
		menuitem:HTMLAttributes;
		meta:HTMLAttributes;
		meter:HTMLAttributes;
		nav:HTMLAttributes;
		noscript:HTMLAttributes;
		object:HTMLAttributes;
		ol:HTMLAttributes;
		optgroup:HTMLAttributes;
		option:HTMLAttributes;
		output:HTMLAttributes;
		p:HTMLAttributes;
		param:HTMLAttributes;
		picture:HTMLAttributes;
		pre:HTMLAttributes;
		progress:HTMLAttributes;
		q:HTMLAttributes;
		rp:HTMLAttributes;
		rt:HTMLAttributes;
		ruby:HTMLAttributes;
		s:HTMLAttributes;
		samp:HTMLAttributes;
		script:HTMLAttributes;
		section:HTMLAttributes;
		select:HTMLAttributes;
		slot:HTMLAttributes;
		small:HTMLAttributes;
		source:HTMLAttributes;
		span:HTMLAttributes;
		strong:HTMLAttributes;
		style:HTMLAttributes;
		sub:HTMLAttributes;
		summary:HTMLAttributes;
		sup:HTMLAttributes;
		table:HTMLAttributes;
		tbody:HTMLAttributes;
		td:HTMLAttributes;
		textarea:HTMLAttributes;
		tfoot:HTMLAttributes;
		th:HTMLAttributes;
		thead:HTMLAttributes;
		time:HTMLAttributes;
		title:HTMLAttributes;
		tr:HTMLAttributes;
		track:HTMLAttributes;
		u:HTMLAttributes;
		ul:HTMLAttributes;
		"var":HTMLAttributes;
		video:HTMLAttributes;
		wbr:HTMLAttributes;

		//SVG
		svg:SVGAttributes;
		animate:SVGAttributes;
		circle:SVGAttributes;
		clipPath:SVGAttributes;
		defs:SVGAttributes;
		ellipse:SVGAttributes;
		feBlend:SVGAttributes;
		feColorMatrix:SVGAttributes;
		feComponentTransfer:SVGAttributes;
		feComposite:SVGAttributes;
		feConvolveMatrix:SVGAttributes;
		feDiffuseLighting:SVGAttributes;
		feDisplacementMap:SVGAttributes;
		feFlood:SVGAttributes;
		feGaussianBlur:SVGAttributes;
		feImage:SVGAttributes;
		feMerge:SVGAttributes;
		feMergeNode:SVGAttributes;
		feMorphology:SVGAttributes;
		feOffset:SVGAttributes;
		feSpecularLighting:SVGAttributes;
		feTile:SVGAttributes;
		feTurbulence:SVGAttributes;
		filter:SVGAttributes;
		foreignObject:SVGAttributes;
		g:SVGAttributes;
		image:SVGAttributes;
		line:SVGAttributes;
		linearGradient:SVGAttributes;
		marker:SVGAttributes;
		mask:SVGAttributes;
		path:SVGAttributes;
		pattern:SVGAttributes;
		polygon:SVGAttributes;
		polyline:SVGAttributes;
		radialGradient:SVGAttributes;
		rect:SVGAttributes;
		stop:SVGAttributes;
		symbol:SVGAttributes;
		text:SVGAttributes;
		tspan:SVGAttributes;
		use:SVGAttributes;
	}
}
