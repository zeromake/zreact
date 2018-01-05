declare type ChildCallbackType = (child?: zreact.VNode, index?: number, arr?: zreact.VNode[]) => (zreact.VNode)|any;

declare namespace zreact {
    type childType = JSX.Element|string|boolean|null|undefined;
    type childrenType = Array<childType|childType[]>;
    const Children: {
        map: (children: childType[], callback: ChildCallbackType, ctx?: any) => VNode[];
        forEach: (children: childType[], callback: ChildCallbackType, ctx?: any) => any;
        count: (children: childType[]) => number;
        only: (children: childType[]) => VNode;
        toArray: (children: childType[]) => VNode[];
    }
    interface IVDom {
        /**
         * dom所属的顶级Component
         */
        component?: zreact.Component<any, any>;
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
        props?: any | boolean;
        /**
         * 通过props设置的事件方法, 通过eventProxy来调用, 保证在不停的props变化时不会一直绑定与解绑。
         */
        listeners?: any;
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
    interface ComponentProps<C extends Component<any, any> | FunctionalComponent<any>> {
        children?: JSX.Element[];
        key?: string | number | any;
        ref?: (el: C) => void;
    }

    interface DangerouslySetInnerHTML {
        __html: string;
    }

    interface ZreactHTMLAttributes {
        children?: childType | childrenType;
        dangerouslySetInnerHTML?: DangerouslySetInnerHTML;
        key?: string;
        ref?: (el?: Element | IVDom) => void;
    }

    interface VNode {
        nodeName: ComponentConstructor<any, any>|string;
        attributes: {[name: string]: any};
        children: (childType[]) | undefined;
        key?: string;
    }

    interface ComponentLifecycle<PropsType, StateType> {
        componentWillMount?(): void;
        componentDidMount?(): void;
        componentWillUnmount?(): void;
        componentWillReceiveProps?(
            nextProps: PropsType,
            nextContext: any,
        ): void;
        shouldComponentUpdate?(
            nextProps: PropsType,
            nextState: StateType,
            nextContext: any,
        ): boolean;
        componentWillUpdate?(
            nextProps: PropsType,
            nextState: StateType,
            nextContext: any,
        ): void;
        componentDidUpdate?(
            previousProps: PropsType,
            previousState: StateType,
            previousContext: any,
        ): void;
    }

    interface FunctionalComponent<PropsType> {
        (props?: PropsType & ComponentProps<this>, context?: any): JSX.Element;
        displayName?: string;
        defaultProps?: any;
    }

    interface ComponentConstructor<PropsType, StateType> {
        new (props?: PropsType, context?: any): Component<PropsType, StateType>;
    }

    // Type alias for a component considered generally, whether stateless or stateful.
    type AnyComponent<PropsType, StateType> = FunctionalComponent<PropsType>|ComponentConstructor<PropsType, StateType>;

    abstract class Component<PropsType, StateType> {
        public static displayName?: string;
        public static defaultProps?: any;

        public state: StateType;
        public props: PropsType & ComponentProps<this>;
        public context: any;
        constructor(props?: PropsType, context?: any);
        linkState: (name: string) => (event: Event) => void;

        public setState<K extends keyof StateType>(
            state: Pick<StateType, K>|((prevState: StateType, props: PropsType) => Pick<StateType, K>),
            callback?: () => void,
        ): void;

        public forceUpdate(callback?: () => void): void;
        public getChildContext?(): any;
        public abstract render(
            props?: PropsType & ComponentProps<this>,
            state?: StateType, context?: any,
        ): childType;
    }

    interface Component<PropsType, StateType> extends ComponentLifecycle<PropsType, StateType> { }

    function h<PropsType>(
        node: ComponentConstructor<PropsType, any>|FunctionalComponent<PropsType>,
        params?: PropsType,
        ...children: childrenType,
    ): JSX.Element;

    function h(
        node: string,
        params?: JSX.HTMLAttributes&JSX.SVGAttributes&{[propName: string]: any},
        ...children: childrenType,
    ): JSX.Element;

    function render(
        node: JSX.Element,
        parent: Element|Document,
        mergeWith?: Element,
    ): childType;

    function rerender(): void;

    function cloneElement(
        element: JSX.Element,
        props: any,
        ...children: childrenType,
    ): JSX.Element;

    function isValidElement(element: VNode| any): boolean;

    function findDOMNode(componentOrVdom: any): HTMLElement;

    function findVDom(componentOrDom: any | Node | Element): IVDom;

    const options: {
        /**
         * render更新后钩子比componentDidUpdate更后面执行
         */
        afterUpdate?: (component: Component<any, any>) => void;
        /**
         * dom卸载载前钩子比componentWillUnmount更先执行
         */
        beforeUnmount?: (component: Component<any, any>) => void;
        /**
         * dom挂载后钩子比componentDidMount更先执行
         */
        afterMount?: (component: Component<any, any>) => void;
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
        /**
         * ref 默认为vdom,
         */
        ref?: ((vdom: IVDom) => any) | boolean;
    };
}

declare module "zreact" {
    export = zreact;
}

declare module "zreact/devtools" {
    export const initDevTools: (vdom?: zreact.IVDom) => void;
}

declare module "zreact/prop-types" {
    type check = () => check;
    // check.isRequired = check;
    export interface PropTypes {
        array: check;
        bool: check;
        func: check;
        number: check;
        object: check;
        string: check;
        any: check;
        arrayOf: check;
        element: check;
        instanceOf: check;
        node: check;
        objectOf: check;
        oneOf: check;
        oneOfType: check;
        shape: check;
    }
}

declare namespace JSX {
    type Element = zreact.VNode;

    interface ElementClass extends zreact.Component<any, any> {
    }

    interface ElementAttributesProperty {
        props: any;
    }

    interface SVGAttributes extends HTMLAttributes {
        accentHeight?: number | string;
        accumulate?: "none" | "sum";
        additive?: "replace" | "sum";
        alignmentBaseline?: "auto" | "baseline" | "before-edge" | "text-before-edge" | "middle" | "central" | "after-edge" | "text-after-edge" | "ideographic" | "alphabetic" | "hanging" | "mathematical" | "inherit";
        allowReorder?: "no" | "yes";
        alphabetic?: number | string;
        amplitude?: number | string;
        arabicForm?: "initial" | "medial" | "terminal" | "isolated";
        ascent?: number | string;
        attributeName?: string;
        attributeType?: string;
        autoReverse?: number | string;
        azimuth?: number | string;
        baseFrequency?: number | string;
        baselineShift?: number | string;
        baseProfile?: number | string;
        bbox?: number | string;
        begin?: number | string;
        bias?: number | string;
        by?: number | string;
        calcMode?: number | string;
        capHeight?: number | string;
        clip?: number | string;
        clipPath?: string;
        clipPathUnits?: number | string;
        clipRule?: number | string;
        colorInterpolation?: number | string;
        colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit";
        colorProfile?: number | string;
        colorRendering?: number | string;
        contentScriptType?: number | string;
        contentStyleType?: number | string;
        cursor?: number | string;
        cx?: number | string;
        cy?: number | string;
        d?: string;
        decelerate?: number | string;
        descent?: number | string;
        diffuseConstant?: number | string;
        direction?: number | string;
        display?: number | string;
        divisor?: number | string;
        dominantBaseline?: number | string;
        dur?: number | string;
        dx?: number | string;
        dy?: number | string;
        edgeMode?: number | string;
        elevation?: number | string;
        enableBackground?: number | string;
        end?: number | string;
        exponent?: number | string;
        externalResourcesRequired?: number | string;
        fill?: string;
        fillOpacity?: number | string;
        fillRule?: "nonzero" | "evenodd" | "inherit";
        filter?: string;
        filterRes?: number | string;
        filterUnits?: number | string;
        floodColor?: number | string;
        floodOpacity?: number | string;
        focusable?: number | string;
        fontFamily?: string;
        fontSize?: number | string;
        fontSizeAdjust?: number | string;
        fontStretch?: number | string;
        fontStyle?: number | string;
        fontVariant?: number | string;
        fontWeight?: number | string;
        format?: number | string;
        from?: number | string;
        fx?: number | string;
        fy?: number | string;
        g1?: number | string;
        g2?: number | string;
        glyphName?: number | string;
        glyphOrientationHorizontal?: number | string;
        glyphOrientationVertical?: number | string;
        glyphRef?: number | string;
        gradientTransform?: string;
        gradientUnits?: string;
        hanging?: number | string;
        horizAdvX?: number | string;
        horizOriginX?: number | string;
        ideographic?: number | string;
        imageRendering?: number | string;
        in2?: number | string;
        in?: string;
        intercept?: number | string;
        k1?: number | string;
        k2?: number | string;
        k3?: number | string;
        k4?: number | string;
        k?: number | string;
        kernelMatrix?: number | string;
        kernelUnitLength?: number | string;
        kerning?: number | string;
        keyPoints?: number | string;
        keySplines?: number | string;
        keyTimes?: number | string;
        lengthAdjust?: number | string;
        letterSpacing?: number | string;
        lightingColor?: number | string;
        limitingConeAngle?: number | string;
        local?: number | string;
        markerEnd?: string;
        markerHeight?: number | string;
        markerMid?: string;
        markerStart?: string;
        markerUnits?: number | string;
        markerWidth?: number | string;
        mask?: string;
        maskContentUnits?: number | string;
        maskUnits?: number | string;
        mathematical?: number | string;
        mode?: number | string;
        numOctaves?: number | string;
        offset?: number | string;
        opacity?: number | string;
        operator?: number | string;
        order?: number | string;
        orient?: number | string;
        orientation?: number | string;
        origin?: number | string;
        overflow?: number | string;
        overlinePosition?: number | string;
        overlineThickness?: number | string;
        paintOrder?: number | string;
        panose1?: number | string;
        pathLength?: number | string;
        patternContentUnits?: string;
        patternTransform?: number | string;
        patternUnits?: string;
        pointerEvents?: number | string;
        points?: string;
        pointsAtX?: number | string;
        pointsAtY?: number | string;
        pointsAtZ?: number | string;
        preserveAlpha?: number | string;
        preserveAspectRatio?: string;
        primitiveUnits?: number | string;
        r?: number | string;
        radius?: number | string;
        refX?: number | string;
        refY?: number | string;
        renderingIntent?: number | string;
        repeatCount?: number | string;
        repeatDur?: number | string;
        requiredExtensions?: number | string;
        requiredFeatures?: number | string;
        restart?: number | string;
        result?: string;
        rotate?: number | string;
        rx?: number | string;
        ry?: number | string;
        scale?: number | string;
        seed?: number | string;
        shapeRendering?: number | string;
        slope?: number | string;
        spacing?: number | string;
        specularConstant?: number | string;
        specularExponent?: number | string;
        speed?: number | string;
        spreadMethod?: string;
        startOffset?: number | string;
        stdDeviation?: number | string;
        stemh?: number | string;
        stemv?: number | string;
        stitchTiles?: number | string;
        stopColor?: string;
        stopOpacity?: number | string;
        strikethroughPosition?: number | string;
        strikethroughThickness?: number | string;
        string?: number | string;
        stroke?: string;
        strokeDasharray?: string | number;
        strokeDashoffset?: string | number;
        strokeLinecap?: "butt" | "round" | "square" | "inherit";
        strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
        strokeMiterlimit?: string;
        strokeOpacity?: number | string;
        strokeWidth?: number | string;
        surfaceScale?: number | string;
        systemLanguage?: number | string;
        tableValues?: number | string;
        targetX?: number | string;
        targetY?: number | string;
        textAnchor?: string;
        textDecoration?: number | string;
        textLength?: number | string;
        textRendering?: number | string;
        to?: number | string;
        transform?: string;
        u1?: number | string;
        u2?: number | string;
        underlinePosition?: number | string;
        underlineThickness?: number | string;
        unicode?: number | string;
        unicodeBidi?: number | string;
        unicodeRange?: number | string;
        unitsPerEm?: number | string;
        vAlphabetic?: number | string;
        values?: string;
        vectorEffect?: number | string;
        version?: string;
        vertAdvY?: number | string;
        vertOriginX?: number | string;
        vertOriginY?: number | string;
        vHanging?: number | string;
        vIdeographic?: number | string;
        viewBox?: string;
        viewTarget?: number | string;
        visibility?: number | string;
        vMathematical?: number | string;
        widths?: number | string;
        wordSpacing?: number | string;
        writingMode?: number | string;
        x1?: number | string;
        x2?: number | string;
        x?: number | string;
        xChannelSelector?: string;
        xHeight?: number | string;
        xlinkActuate?: string;
        xlinkArcrole?: string;
        xlinkHref?: string;
        xlinkRole?: string;
        xlinkShow?: string;
        xlinkTitle?: string;
        xlinkType?: string;
        xmlBase?: string;
        xmlLang?: string;
        xmlns?: string;
        xmlnsXlink?: string;
        xmlSpace?: string;
        y1?: number | string;
        y2?: number | string;
        y?: number | string;
        yChannelSelector?: string;
        z?: number | string;
        zoomAndPan?: string;
    }

    interface PathAttributes {
        d: string;
    }

    type EventHandler<E extends Event> = (event: E) => void;

    // interface EventHandler<E extends Event> {
    //     (event: E): void;
    // }

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
        onLoad?: GenericEventHandler;
        onLoadCapture?: GenericEventHandler;

        // Clipboard Events
        onCopy?: ClipboardEventHandler;
        onCopyCapture?: ClipboardEventHandler;
        onCut?: ClipboardEventHandler;
        onCutCapture?: ClipboardEventHandler;
        onPaste?: ClipboardEventHandler;
        onPasteCapture?: ClipboardEventHandler;

        // Composition Events
        onCompositionEnd?: CompositionEventHandler;
        onCompositionEndCapture?: CompositionEventHandler;
        onCompositionStart?: CompositionEventHandler;
        onCompositionStartCapture?: CompositionEventHandler;
        onCompositionUpdate?: CompositionEventHandler;
        onCompositionUpdateCapture?: CompositionEventHandler;

        // Focus Events
        onFocus?: FocusEventHandler;
        onFocusCapture?: FocusEventHandler;
        onBlur?: FocusEventHandler;
        onBlurCapture?: FocusEventHandler;

        // Form Events
        onChange?: GenericEventHandler;
        onChangeCapture?: GenericEventHandler;
        onInput?: GenericEventHandler;
        onInputCapture?: GenericEventHandler;
        onSearch?: GenericEventHandler;
        onSearchCapture?: GenericEventHandler;
        onSubmit?: GenericEventHandler;
        onSubmitCapture?: GenericEventHandler;

        // Keyboard Events
        onKeyDown?: KeyboardEventHandler;
        onKeyDownCapture?: KeyboardEventHandler;
        onKeyPress?: KeyboardEventHandler;
        onKeyPressCapture?: KeyboardEventHandler;
        onKeyUp?: KeyboardEventHandler;
        onKeyUpCapture?: KeyboardEventHandler;

        // Media Events
        onAbort?: GenericEventHandler;
        onAbortCapture?: GenericEventHandler;
        onCanPlay?: GenericEventHandler;
        onCanPlayCapture?: GenericEventHandler;
        onCanPlayThrough?: GenericEventHandler;
        onCanPlayThroughCapture?: GenericEventHandler;
        onDurationChange?: GenericEventHandler;
        onDurationChangeCapture?: GenericEventHandler;
        onEmptied?: GenericEventHandler;
        onEmptiedCapture?: GenericEventHandler;
        onEncrypted?: GenericEventHandler;
        onEncryptedCapture?: GenericEventHandler;
        onEnded?: GenericEventHandler;
        onEndedCapture?: GenericEventHandler;
        onLoadedData?: GenericEventHandler;
        onLoadedDataCapture?: GenericEventHandler;
        onLoadedMetadata?: GenericEventHandler;
        onLoadedMetadataCapture?: GenericEventHandler;
        onLoadStart?: GenericEventHandler;
        onLoadStartCapture?: GenericEventHandler;
        onPause?: GenericEventHandler;
        onPauseCapture?: GenericEventHandler;
        onPlay?: GenericEventHandler;
        onPlayCapture?: GenericEventHandler;
        onPlaying?: GenericEventHandler;
        onPlayingCapture?: GenericEventHandler;
        onProgress?: GenericEventHandler;
        onProgressCapture?: GenericEventHandler;
        onRateChange?: GenericEventHandler;
        onRateChangeCapture?: GenericEventHandler;
        onSeeked?: GenericEventHandler;
        onSeekedCapture?: GenericEventHandler;
        onSeeking?: GenericEventHandler;
        onSeekingCapture?: GenericEventHandler;
        onStalled?: GenericEventHandler;
        onStalledCapture?: GenericEventHandler;
        onSuspend?: GenericEventHandler;
        onSuspendCapture?: GenericEventHandler;
        onTimeUpdate?: GenericEventHandler;
        onTimeUpdateCapture?: GenericEventHandler;
        onVolumeChange?: GenericEventHandler;
        onVolumeChangeCapture?: GenericEventHandler;
        onWaiting?: GenericEventHandler;
        onWaitingCapture?: GenericEventHandler;

        // MouseEvents
        onClick?: MouseEventHandler;
        onClickCapture?: MouseEventHandler;
        onContextMenu?: MouseEventHandler;
        onContextMenuCapture?: MouseEventHandler;
        onDblClick?: MouseEventHandler;
        onDblClickCapture?: MouseEventHandler;
        onDrag?: DragEventHandler;
        onDragCapture?: DragEventHandler;
        onDragEnd?: DragEventHandler;
        onDragEndCapture?: DragEventHandler;
        onDragEnter?: DragEventHandler;
        onDragEnterCapture?: DragEventHandler;
        onDragExit?: DragEventHandler;
        onDragExitCapture?: DragEventHandler;
        onDragLeave?: DragEventHandler;
        onDragLeaveCapture?: DragEventHandler;
        onDragOver?: DragEventHandler;
        onDragOverCapture?: DragEventHandler;
        onDragStart?: DragEventHandler;
        onDragStartCapture?: DragEventHandler;
        onDrop?: DragEventHandler;
        onDropCapture?: DragEventHandler;
        onMouseDown?: MouseEventHandler;
        onMouseDownCapture?: MouseEventHandler;
        onMouseEnter?: MouseEventHandler;
        onMouseEnterCapture?: MouseEventHandler;
        onMouseLeave?: MouseEventHandler;
        onMouseLeaveCapture?: MouseEventHandler;
        onMouseMove?: MouseEventHandler;
        onMouseMoveCapture?: MouseEventHandler;
        onMouseOut?: MouseEventHandler;
        onMouseOutCapture?: MouseEventHandler;
        onMouseOver?: MouseEventHandler;
        onMouseOverCapture?: MouseEventHandler;
        onMouseUp?: MouseEventHandler;
        onMouseUpCapture?: MouseEventHandler;

        // Selection Events
        onSelect?: GenericEventHandler;
        onSelectCapture?: GenericEventHandler;

        // Touch Events
        onTouchCancel?: TouchEventHandler;
        onTouchCancelCapture?: TouchEventHandler;
        onTouchEnd?: TouchEventHandler;
        onTouchEndCapture?: TouchEventHandler;
        onTouchMove?: TouchEventHandler;
        onTouchMoveCapture?: TouchEventHandler;
        onTouchStart?: TouchEventHandler;
        onTouchStartCapture?: TouchEventHandler;

        // UI Events
        onScroll?: UIEventHandler;
        onScrollCapture?: UIEventHandler;

        // Wheel Events
        onWheel?: WheelEventHandler;
        onWheelCapture?: WheelEventHandler;

        // Animation Events
        onAnimationStart?: AnimationEventHandler;
        onAnimationStartCapture?: AnimationEventHandler;
        onAnimationEnd?: AnimationEventHandler;
        onAnimationEndCapture?: AnimationEventHandler;
        onAnimationIteration?: AnimationEventHandler;
        onAnimationIterationCapture?: AnimationEventHandler;

        // Transition Events
        onTransitionEnd?: TransitionEventHandler;
        onTransitionEndCapture?: TransitionEventHandler;
    }
    interface HTMLAttributes extends zreact.ZreactHTMLAttributes, DOMAttributes {
        // Standard HTML Attributes
        accept?: string;
        acceptCharset?: string;
        accessKey?: string;
        action?: string;
        allowFullScreen?: boolean;
        allowTransparency?: boolean;
        alt?: string;
        as?: string;
        async?: boolean;
        autocomplete?: string;
        autofocus?: boolean;
        autoPlay?: boolean;
        capture?: boolean;
        cellPadding?: number | string;
        cellSpacing?: number | string;
        charSet?: string;
        challenge?: string;
        checked?: boolean;
        class?: string | { [key: string]: boolean };
        className?: string | { [key: string]: boolean };
        cols?: number;
        colSpan?: number;
        content?: string;
        contentEditable?: boolean;
        contextMenu?: string;
        controls?: boolean;
        coords?: string;
        crossOrigin?: string;
        data?: string;
        dateTime?: string;
        default?: boolean;
        defer?: boolean;
        dir?: string;
        disabled?: boolean;
        download?: any;
        draggable?: boolean;
        encType?: string;
        form?: string;
        formAction?: string;
        formEncType?: string;
        formMethod?: string;
        formNoValidate?: boolean;
        formTarget?: string;
        frameBorder?: number | string;
        headers?: string;
        height?: number | string;
        hidden?: boolean;
        high?: number;
        href?: string;
        hrefLang?: string;
        for?: string;
        httpEquiv?: string;
        icon?: string;
        id?: string;
        inputMode?: string;
        integrity?: string;
        is?: string;
        keyParams?: string;
        keyType?: string;
        kind?: string;
        label?: string;
        lang?: string;
        list?: string;
        loop?: boolean;
        low?: number;
        manifest?: string;
        marginHeight?: number;
        marginWidth?: number;
        max?: number | string;
        maxLength?: number;
        media?: string;
        mediaGroup?: string;
        method?: string;
        min?: number | string;
        minLength?: number;
        multiple?: boolean;
        muted?: boolean;
        name?: string;
        noValidate?: boolean;
        open?: boolean;
        optimum?: number;
        pattern?: string;
        placeholder?: string;
        poster?: string;
        preload?: string;
        radioGroup?: string;
        readOnly?: boolean;
        rel?: string;
        required?: boolean;
        role?: string;
        rows?: number;
        rowSpan?: number;
        sandbox?: string;
        scope?: string;
        scoped?: boolean;
        scrolling?: string;
        seamless?: boolean;
        selected?: boolean;
        shape?: string;
        size?: number;
        sizes?: string;
        slot?: string;
        span?: number;
        spellCheck?: boolean;
        src?: string;
        srcset?: string;
        srcDoc?: string;
        srcLang?: string;
        srcSet?: string;
        start?: number;
        step?: number | string;
        style?: any;
        summary?: string;
        tabIndex?: number;
        target?: string;
        title?: string;
        type?: string;
        useMap?: string;
        value?: string | string[];
        width?: number | string;
        wmode?: string;
        wrap?: string;

        // RDFa Attributes
        about?: string;
        datatype?: string;
        inlist?: any;
        prefix?: string;
        property?: string;
        resource?: string;
        typeof?: string;
        vocab?: string;
    }

    interface IntrinsicElements {
        // HTML
        a: HTMLAttributes;
        abbr: HTMLAttributes;
        address: HTMLAttributes;
        area: HTMLAttributes;
        article: HTMLAttributes;
        aside: HTMLAttributes;
        audio: HTMLAttributes;
        b: HTMLAttributes;
        base: HTMLAttributes;
        bdi: HTMLAttributes;
        bdo: HTMLAttributes;
        big: HTMLAttributes;
        blockquote: HTMLAttributes;
        body: HTMLAttributes;
        br: HTMLAttributes;
        button: HTMLAttributes;
        canvas: HTMLAttributes;
        caption: HTMLAttributes;
        cite: HTMLAttributes;
        code: HTMLAttributes;
        col: HTMLAttributes;
        colgroup: HTMLAttributes;
        data: HTMLAttributes;
        datalist: HTMLAttributes;
        dd: HTMLAttributes;
        del: HTMLAttributes;
        details: HTMLAttributes;
        dfn: HTMLAttributes;
        dialog: HTMLAttributes;
        div: HTMLAttributes;
        dl: HTMLAttributes;
        dt: HTMLAttributes;
        em: HTMLAttributes;
        embed: HTMLAttributes;
        fieldset: HTMLAttributes;
        figcaption: HTMLAttributes;
        figure: HTMLAttributes;
        footer: HTMLAttributes;
        form: HTMLAttributes;
        h1: HTMLAttributes;
        h2: HTMLAttributes;
        h3: HTMLAttributes;
        h4: HTMLAttributes;
        h5: HTMLAttributes;
        h6: HTMLAttributes;
        head: HTMLAttributes;
        header: HTMLAttributes;
        hr: HTMLAttributes;
        html: HTMLAttributes;
        i: HTMLAttributes;
        iframe: HTMLAttributes;
        img: HTMLAttributes;
        input: HTMLAttributes;
        ins: HTMLAttributes;
        kbd: HTMLAttributes;
        keygen: HTMLAttributes;
        label: HTMLAttributes;
        legend: HTMLAttributes;
        li: HTMLAttributes;
        link: HTMLAttributes;
        main: HTMLAttributes;
        map: HTMLAttributes;
        mark: HTMLAttributes;
        menu: HTMLAttributes;
        menuitem: HTMLAttributes;
        meta: HTMLAttributes;
        meter: HTMLAttributes;
        nav: HTMLAttributes;
        noscript: HTMLAttributes;
        object: HTMLAttributes;
        ol: HTMLAttributes;
        optgroup: HTMLAttributes;
        option: HTMLAttributes;
        output: HTMLAttributes;
        p: HTMLAttributes;
        param: HTMLAttributes;
        picture: HTMLAttributes;
        pre: HTMLAttributes;
        progress: HTMLAttributes;
        q: HTMLAttributes;
        rp: HTMLAttributes;
        rt: HTMLAttributes;
        ruby: HTMLAttributes;
        s: HTMLAttributes;
        samp: HTMLAttributes;
        script: HTMLAttributes;
        section: HTMLAttributes;
        select: HTMLAttributes;
        slot: HTMLAttributes;
        small: HTMLAttributes;
        source: HTMLAttributes;
        span: HTMLAttributes;
        strong: HTMLAttributes;
        style: HTMLAttributes;
        sub: HTMLAttributes;
        summary: HTMLAttributes;
        sup: HTMLAttributes;
        table: HTMLAttributes;
        tbody: HTMLAttributes;
        td: HTMLAttributes;
        textarea: HTMLAttributes;
        tfoot: HTMLAttributes;
        th: HTMLAttributes;
        thead: HTMLAttributes;
        time: HTMLAttributes;
        title: HTMLAttributes;
        tr: HTMLAttributes;
        track: HTMLAttributes;
        u: HTMLAttributes;
        ul: HTMLAttributes;
        "var": HTMLAttributes;
        video: HTMLAttributes;
        wbr: HTMLAttributes;
        // SVG
        svg: SVGAttributes;
        animate: SVGAttributes;
        circle: SVGAttributes;
        clipPath: SVGAttributes;
        defs: SVGAttributes;
        ellipse: SVGAttributes;
        feBlend: SVGAttributes;
        feColorMatrix: SVGAttributes;
        feComponentTransfer: SVGAttributes;
        feComposite: SVGAttributes;
        feConvolveMatrix: SVGAttributes;
        feDiffuseLighting: SVGAttributes;
        feDisplacementMap: SVGAttributes;
        feFlood: SVGAttributes;
        feGaussianBlur: SVGAttributes;
        feImage: SVGAttributes;
        feMerge: SVGAttributes;
        feMergeNode: SVGAttributes;
        feMorphology: SVGAttributes;
        feOffset: SVGAttributes;
        feSpecularLighting: SVGAttributes;
        feTile: SVGAttributes;
        feTurbulence: SVGAttributes;
        filter: SVGAttributes;
        foreignObject: SVGAttributes;
        g: SVGAttributes;
        image: SVGAttributes;
        line: SVGAttributes;
        linearGradient: SVGAttributes;
        marker: SVGAttributes;
        mask: SVGAttributes;
        path: SVGAttributes;
        pattern: SVGAttributes;
        polygon: SVGAttributes;
        polyline: SVGAttributes;
        radialGradient: SVGAttributes;
        rect: SVGAttributes;
        stop: SVGAttributes;
        symbol: SVGAttributes;
        text: SVGAttributes;
        tspan: SVGAttributes;
        use: SVGAttributes;
    }
}
