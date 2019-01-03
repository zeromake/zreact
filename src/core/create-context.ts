import { isFn } from "./util";
import { Component } from "./component";
import { Renderer } from "./create-renderer";
import {
    OwnerType,
    IBaseProps,
    ChildrenType,
    IProvider,
    IConsumer,
    IConsumerState,
    IProviderProps,
    IProviderState,
} from "./type-shared";
import { IFiber } from "../fiber/type-shared";

const MAX_NUMBER = 1073741823;
export function createContext<T>(defaultValue: T, calculateChangedBits?: ((old: T, now: T) => number) | null): typeof IProvider {
    if (calculateChangedBits == null) {
        calculateChangedBits = null;
    }

    function triggerConsumer(value: T, component: OwnerType | IFiber, changedBits: number): void {
        let fiber: IFiber = component as IFiber;
        if ((component as OwnerType).setState) {
            (component as OwnerType).setState({
                value,
            });
            (component as Consumer).observedBits += changedBits;
            fiber = (component as OwnerType).$reactInternalFiber!;
            return;
        }
        Renderer.updateComponent!(fiber, true);
    }

    class Consumer extends Component<IBaseProps, IConsumerState<T>> implements IConsumer<T> {
        public observedBits: number;
        public subscribers: Array<OwnerType | IFiber> | null;
        constructor(props: IBaseProps) {
            super(props);
            const fiber = this.$reactInternalFiber!;
            const providerFiber = Provider.getContext(fiber);
            const instance = (providerFiber && providerFiber.stateNode as Provider | null);
            if (instance) {
                instance.subscribers.push(this);
                this.subscribers = instance.subscribers;
            } else {
                this.subscribers = null;
                console.warn(`${fiber.name}.Consumer not find Provider!`);
            }
            this.observedBits = 0;
            this.state = {
                value: instance ? instance.value : defaultValue,
            };
        }
        public componentWillUnmount() {
            const subscribers = this.subscribers;
            if (subscribers) {
                const i = subscribers.lastIndexOf(this);
                subscribers.splice(i, 1);
            }
        }
        public render() {
            const render: (value: T) => ChildrenType = this.props.children as (value: T) => ChildrenType;
            return render(this.state.value);
        }
    }

    class Provider extends Component<IProviderProps<T>, IProviderState<T>> implements IProvider<T> {
        public static Provider: typeof IProvider = Provider as any;
        public static Consumer: typeof IConsumer = Consumer as (typeof IConsumer);
        public static defaultValue: T = defaultValue;
        public static defaultProps: {
            value: T;
        } = {
            value: defaultValue,
        };
        // public static providers: Provider[] = [];

        /**
         * 查找 Provider
         * @param fiber
         */
        public static getContext(fiber: IFiber, now?: IFiber): IFiber | null {
            while (fiber.return) {
                if ((fiber.type as any) === Provider && fiber !== now) {
                    return fiber;
                }
                fiber = fiber.return;
            }
            return null;
        }
        public static getDerivedStateFromProps(nextProps: any, preState: any) {
            const self = preState.self as Provider;
            if (self.props.value !== nextProps.value) {
                const oldValue = self.props.value;
                const newValue: T = nextProps.value;
                let changedBits = 0;
                if (!Object.is(oldValue, newValue)) {
                    self.value = newValue;
                    changedBits = calculateChangedBits ? calculateChangedBits(oldValue, newValue) : MAX_NUMBER;
                    changedBits |= 0;
                    if (changedBits !== 0) {
                        self.subscribers.forEach((component: OwnerType | IFiber) => {
                            triggerConsumer(newValue, component, changedBits);
                        });
                    }
                }
            }
        }
        public value: T;
        public subscribers: Array<OwnerType | IFiber>;
        constructor(props: IProviderProps<T>) {
            super(props);
            this.state = {
                self: this,
            };
            this.value = props.value;
            this.subscribers = [];
            // Provider.providers.push(this);
        }
        public componentWillUnmount() {
            if (this.subscribers.length) {
                this.subscribers.forEach((fiber: IFiber|OwnerType) => {
                    const old = fiber;
                    const isComponent = !!(fiber as OwnerType).setState;
                    if (isComponent) {
                        fiber = (fiber as OwnerType).$reactInternalFiber as IFiber;
                    }
                    const provider = Provider.getContext(fiber as IFiber, this.$reactInternalFiber);
                    if (provider) {
                        const instance = provider.stateNode as Provider;
                        instance.subscribers.push(old);
                        triggerConsumer(instance.value, old, 0);
                    } else {
                        console.log(`Provider Unmount ${(fiber as IFiber).name}.Consumer not find Provider!`);
                        triggerConsumer(defaultValue, old, 0);
                    }
                });
            }
            this.subscribers.length = 0;
            // const i = Provider.providers.lastIndexOf(this);
            // Provider.providers.splice(i, 1);
        }
        public render() {
            return this.props.children;
        }
    }
    return Provider as any;
}
