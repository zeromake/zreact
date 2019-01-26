import { IFiber } from "zreact-fiber/type-shared";
import { type } from "os";

/**
 * createRef
 */
export interface IObjectRef<T> {
    current: T;
}
export type RefElement = Element | Node | OwnerType | null;
export type IRefFun = (node: RefElement) => any;

export type IRefType = IObjectRef<RefElement> | string | IRefFun;

export interface IWorkContext {
    contextStack: IBaseObject[];
    containerStack: OwnerType[];
}
export interface IOwnerAttribute {
    /**
     * fiber 实例
     */
    $reactInternalFiber?: IFiber;
    /**
     * 组件更新器
     */
    updater?: IUpdater;
    /**
     * 获取组件实例或者 dom 对象
     */
    ref?: IRefType;
    /**
     * render 时传递的属性
     */
    props?: Readonly<IBaseProps>|null;
    /**
     * 父组件传递的上下文
     */
    context?: object;
    /**
     * render 生成 vnode
     */
    /**
     * 是否为无状态组件
     */
    $isStateless?: boolean;
    /**
     * 无状态组件是否在初始化
     */
    $init?: boolean;
    $useNewHooks?: boolean;
    insertPoint?: IFiber|null;
    state?: IBaseObject;
    $unmaskedContext?: IBaseObject;
    $maskedContext?: IBaseObject;
    $$useHook?: {
        index: number;
        length: number;
        states: any[];
        calls: Array<(state: any) => void>;
    };
    setState?: any;
    contextType?: typeof IProvider;
    render?(): VirtualNode[] | VirtualNode | ChildrenType;
    renderImpl?(p: IBaseProps): VirtualNode[] | VirtualNode;
    getChildContext?(): IBaseObject;
    forceUpdate?(cb: () => void): void;
    willUnmount?(): void;
    didUpdate?(): void;
}

export interface IAnuElement extends Element, IOwnerAttribute {
    $reactInternalFiber?: IFiber;
}

export type OwnerType = IOwnerAttribute | IComponentMinx<any, any> | IAnuElement;

export interface IVNode {
    $$typeof?: symbol | number;
    /**
     * vnode 的类型
     */
    tag: number;
    /**
     * dom名或组件class|function
     */
    type: VNodeType;
    /**
     * 组件参数
     */
    props: IBaseProps;
    $owner?: OwnerType | null;
    key?: string | null;
    /**
     * ref 获取组件实例
     */
    ref?: IRefType;
    text?: string;
    /**
     * 是否为传送门
     */
    isPortal?: boolean;
}

type VNode =
    | IVNode
    | string
    | number
    | boolean
    | undefined
    | void
    | null;

export type VirtualNode = VNode | VirtualNodeFun | VNode[];

export type VirtualNodeFun = (...args: any[]) => ChildrenType;

export interface IBaseObject {
    [name: string]: any;
}

export type VirtualNodeList = Array<
    VirtualNode
    |VirtualNode[]
    |(VirtualNode[][])
>;

export type ChildrenType = VirtualNode|VirtualNodeList;

export interface IBaseProps extends IBaseObject {
    children?: ChildrenType;
    ref?: IRefType;
    key?: string | number | undefined;
    className?: string;
}

export interface IComponentLifecycle<P extends IBaseProps, S extends IBaseObject> {
    /**
     * 初始化组件渲染到 dom 前
     * @deprecated
     */
    componentWillMount?(): void;
    /**
     * 初始化组件渲染之后
     */
    componentDidMount?(): void;
    /**
     * 在新的 props 合并前, setState不会触发
     * @param nextProps 新的 props
     * @param nextContext 新的 context
     * @deprecated
     */
    componentWillReceiveProps?(nextProps: Readonly<P>, nextContext?: IBaseObject): void;
    /**
     * 在 render() 之前. 若返回 false，则跳过 render
     * @param nextProps
     * @param nextState
     * @param nextContext
     */
    shouldComponentUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): boolean;
    /**
     * 在新一轮 render 之前，所有的更新操作都会触发。
     * @param nextProps 新的 props
     * @param nextState 新的 state
     * @param nextContext 新的 context
     */
    componentWillUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): void;
    /**
     * 在一次 render 完成后
     * @param preProps 上次 props
     * @param preState 上次 state
     * @param snapshot getSnapshotBeforeUpdate新api
     * @param preContext 上次 context
     */
    componentDidUpdate?(
        prevProps: Readonly<P>,
        prevState: Readonly<S>,
        snapshot?: any,
        prevContext?: IBaseObject,
    ): void;
    /**
     * 卸载dom前
     */
    componentWillUnmount?(): void;
    /**
     * 渲染错误回调
     * @param error
     */
    componentDidCatch?(error?: Error, stack?: {componentStack: string}): void;
    /**
     * 渲染后调用，返回的值注入 componentWillUpdate
     * @param prevProps
     * @param prevState
     */
    getSnapshotBeforeUpdate?(prevProps: P, prevState: S): any;
}

export interface IUpdater {
    /**
     * 挂载顺序
     */
    mountOrder: number;
    prevProps?: IBaseObject;
    prevState?: IBaseProps;
    snapshot?: any;
    /**
     * 触发 state 变化
     * @param component 组件实例
     * @param state
     * @param cb 回调
     */
    enqueueSetState(
        fiber: IFiber,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb?: () => void,
    ): boolean;
    isMounted(component: OwnerType): boolean;
}

export abstract class IComponentMinx<P extends IBaseProps, S extends IBaseObject> implements IOwnerAttribute, IComponentLifecycle<P, S> {
    public static displayName?: string;
    public static defaultProps?: IBaseProps;
    public static contextType?: typeof IProvider;
    public static getDerivedStateFromProps?<T extends IBaseProps, F extends IBaseObject>(nextProps: T, preState: F): F | null | undefined | void;
    public abstract state: Readonly<S>;
    public abstract props: Readonly<P>|null;
    public abstract context?: IBaseObject;
    public abstract $reactInternalFiber?: IFiber;
    public abstract updater: IUpdater;
    public abstract $useNewHooks?: boolean;

    public abstract $isStateless?: boolean;
    public abstract insertPoint?: IFiber|null;

    public abstract $unmaskedContext?: IBaseObject;
    public abstract $maskedContext?: IBaseObject;

    constructor(p?: P, c?: IBaseObject) {}

    public abstract getChildContext?(): IBaseObject;
    public abstract isReactComponent?(): boolean;
    public abstract isMounted(): boolean;
    public abstract replaceState(): void;
    public abstract setState(state: S | ((s: S) => S | void), cb: () => void): void | S;
    public abstract forceUpdate(cb: () => void): void;
    public abstract render(): VirtualNode[] | VirtualNode | ChildrenType;

    public abstract componentWillMount?(): void;
    public abstract componentDidMount?(): void;
    public abstract componentWillReceiveProps?(nextProps: Readonly<P>, nextContext?: IBaseObject): void;
    public abstract shouldComponentUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): boolean;
    public abstract componentWillUpdate?(
        nextProps: Readonly<P>,
        nextState: Readonly<S>,
        nextContext?: IBaseObject,
    ): void;
    public abstract componentDidUpdate?(
        prevProps: Readonly<P>,
        prevState: Readonly<S>,
        snapshot?: any,
        prevContext?: IBaseObject,
    ): void;
    public abstract componentWillUnmount?(): void;
    public abstract componentDidCatch?(error?: Error, stack?: {componentStack: string}): void;
    public abstract getSnapshotBeforeUpdate?(prevProps: P, prevState: S): any;
}
export type IComponentClass = (typeof IComponentMinx);

export type IComponentFunction = (props: IBaseProps, ref?: IRefType) => VirtualNode[] | VirtualNode;

export type VNodeType = IComponentClass | IComponentFunction | string;

// export const enum VType {
//     Text = 1,
//     Node = 1 << 1,
//     Composite = 1 << 2,
//     Stateless = 1 << 3,
//     Void = 1 << 4,
//     Portal = 1 << 5,
// }

export interface IMiddleware {
    begin: () => void;
    end: () => void;
}

export interface IRenderer {
    controlledCbs: any[];
    mountOrder: number;
    macrotasks: IFiber[];
    boundaries: IFiber[];
    currentOwner: OwnerType|null;
    catchError?: any;
    catchStack?: string;
    inserting?: HTMLOrSVGElement;
    eventSystem?: any;
    batchedUpdates?: (call: () => void, options: object) => void;
    // onUpdate(fiber: IFiber): any;
    onBeforeRender?(fiber: IFiber): void;
    onAfterRender?(fiber: IFiber): void;
    onDispose(fiber: IFiber): void;
    middleware(middleware: IMiddleware): void;
    updateControlled(fiber: IFiber): void;
    fireMiddlewares(begin?: boolean): void;
    updateComponent?(
        fiber: IFiber,
        state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
        cb?: () => void,
        immediateUpdate?: boolean,
    ): any;
    scheduleWork?(): void;
    removeElement?(fiber: IFiber): void;
    createElement(fiber: IFiber): OwnerType;
    emptyElement?(fiber: IFiber): void;
    render?(vnode: IVNode, root: Element, callback?: () => void): Element;
    // [name: string]: any;
}

export interface IConsumerState<T> {
    value: T;
}
export abstract class IConsumer<T> extends IComponentMinx<IBaseProps, IConsumerState<T>> {
    public abstract observedBits: number;
    public abstract subscribers: Array<OwnerType | IFiber> | null;
}

export interface IProviderProps<T> extends IBaseProps {
    value: T;
}

export interface IProviderState<T> extends IBaseObject {
    self: IProvider<T>;
}

export abstract class IProvider<T> extends IComponentMinx<IProviderProps<T>, IProviderState<T>> {
    public static Provider: typeof IProvider;
    public static Consumer: typeof IConsumer;
    public static defaultValue: any;
    public static getContext(fiber: IFiber): IFiber | null {
        return null;
    }
    // public static providers: IProvider<any>[];
    public abstract value: T;
    public abstract subscribers: Array<OwnerType | IFiber>;
}

// tslint:disable
declare global {
    namespace JSX {
        type Element = IVNode;
        interface ElementClass extends IComponentMinx<any, any> {

        }
        interface ElementAttributesProperty {
            props: IBaseProps;
        }

        interface ElementChildrenAttribute {
            children: ChildrenType;
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

        type EventHandler<E extends Event> = (event: E) => void;

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
        type PointerEventHandler = EventHandler<PointerEvent>;

        interface DOMAttributes extends IBaseProps {
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

            // Pointer Events
            onPointerOver?: PointerEventHandler;
            onPointerOverCapture?: PointerEventHandler;
            onPointerEnter?: PointerEventHandler;
            onPointerEnterCapture?: PointerEventHandler;
            onPointerDown?: PointerEventHandler;
            onPointerDownCapture?: PointerEventHandler;
            onPointerMove?: PointerEventHandler;
            onPointerMoveCapture?: PointerEventHandler;
            onPointerUp?: PointerEventHandler;
            onPointerUpCapture?: PointerEventHandler;
            onPointerCancel?: PointerEventHandler;
            onPointerCancelCapture?: PointerEventHandler;
            onPointerOut?: PointerEventHandler;
            onPointerOutCapture?: PointerEventHandler;
            onPointerLeave?: PointerEventHandler;
            onPointerLeaveCapture?: PointerEventHandler;
            onGotPointerCapture?: PointerEventHandler;
            onGotPointerCaptureCapture?: PointerEventHandler;
            onLostPointerCapture?: PointerEventHandler;
            onLostPointerCaptureCapture?: PointerEventHandler;

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

        interface HTMLAttributes extends IBaseProps, DOMAttributes {
            // Standard HTML Attributes
            accept?: string;
            acceptCharset?: string;
            accessKey?: string;
            action?: string;
            allowFullScreen?: boolean;
            allowTransparency?: boolean;
            alt?: string;
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
            class?: string;
            className?: string;
            cols?: number;
            colSpan?: number;
            content?: string;
            contentEditable?: boolean;
            contextMenu?: string;
            controls?: boolean;
            controlsList?: string;
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
            playsInline?: boolean;
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
            spellcheck?: boolean;
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
            value?: string | string[] | number;
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
}
