import { Component } from "./component";
import { Renderer } from "./create-renderer";
import {
    IComponentClass,
    IBaseProps,
    ChildrenType,
    IProvider,
    IConsumer,
    IConsumerState,
    IProviderProps,
    IProviderState,
} from "./type-shared";
import { IFiber } from "zreact-fiber/type-shared";

const MAX_NUMBER = 1073741823;
export function createContext<T>(defaultValue: T, calculateChangedBits?: ((old: T, now: T) => number) | null): typeof IProvider {
    if (calculateChangedBits == null) {
        calculateChangedBits = null;
    }

    function triggerConsumer(value: T, fiber: IFiber, changedBits: number): void {
        const component = fiber.type;
        const instance = fiber.stateNode!;
        if (component === Consumer) {
            instance.setState({
                value,
            });
            (instance as Consumer).observedBits += changedBits;
            return;
        } else if ((component as IComponentClass).contextType === Provider) {
            instance.context = value;
        }
        Renderer.updateComponent!(fiber, true);
    }

    class Consumer extends Component<IBaseProps, IConsumerState<T>> implements IConsumer<T> {
        public observedBits: number;
        public subscribers: IFiber[] | null;
        constructor(props: IBaseProps) {
            super(props);
            this.observedBits = 0;
            this.subscribers = null;
            this.state = {
                value: defaultValue,
            };
        }
        public componentDidMount() {
            const fiber = this.$reactInternalFiber!;
            const providerFiber = Provider.getContext(fiber);
            const instance = (providerFiber && providerFiber.stateNode as Provider | null);
            if (instance) {
                instance.subscribers.push(fiber);
                this.subscribers = instance.subscribers;
            } else {
                this.subscribers = null;
            }
            this.setState({
                value: instance ? instance.value : defaultValue,
            });
        }
        public componentWillUnmount() {
            const subscribers = this.subscribers;
            if (subscribers) {
                const i = subscribers.lastIndexOf(this.$reactInternalFiber!);
                subscribers.splice(i, 1);
            }
        }
        public render() {
            const render: (value: T) => ChildrenType = this.props.children as (value: T) => ChildrenType;
            return render(this.state.value);
        }
    }

    class Provider extends Component<IProviderProps<T>, IProviderState<T>> implements IProvider<T> {
        public static Provider: typeof IProvider = Provider as (typeof IProvider);
        public static Consumer: typeof IConsumer = Consumer as (typeof IConsumer);
        public static defaultValue: T = defaultValue;
        public static defaultProps: {
            value: T;
        } = {
            value: defaultValue,
        };

        /**
         * 查找 Provider
         * @param fiber
         */
        public static getContext(fiber?: IFiber): IFiber | null {
            if (fiber && (fiber.type as typeof Provider) === Provider) {
                fiber = fiber.return;
            }
            while (fiber) {
                if ((fiber.type as typeof Provider) === Provider) {
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
                        self.subscribers.forEach((component: IFiber) => {
                            triggerConsumer(newValue, component, changedBits);
                        });
                    }
                }
            }
        }
        public value: T;
        public subscribers: IFiber[];
        constructor(props: IProviderProps<T>) {
            super(props);
            this.state = {
                self: this,
            };
            this.value = props.value;
            this.subscribers = [];
        }

        public componentDidMount() {
            const selfFiber = this.$reactInternalFiber;
            const fiber = Provider.getContext(selfFiber);
            if (fiber) {
                const instance = fiber.stateNode! as Provider;
                if  (instance.subscribers.length > 0) {
                    const oldSubscribers = [];
                    for (const sub of instance.subscribers) {
                        if (Provider.getContext(sub) === selfFiber) {
                            this.subscribers.push(sub);
                            triggerConsumer(this.value, sub, 0);
                        } else {
                            oldSubscribers.push(sub);
                        }
                    }
                    instance.subscribers.length = 0;
                    instance.subscribers.push(...oldSubscribers);
                }
            }
        }
        public componentWillUnmount() {
            if (this.subscribers.length) {
                this.subscribers.forEach((fiber: IFiber) => {
                    const old = fiber;
                    const provider = Provider.getContext(this.$reactInternalFiber);
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
