import { Component } from "./component";

function createEventEmitter(value: any, context: any) {
    let handlers: any[] = [];
    return {
        on(handler: any) {
            handlers.push(handler);
        },
        off(handler: any) {
            handlers = handlers.filter((h: any) => h !== handler);
        },
        get() {
            return value;
        },
        set(newValue: any, changedBits: any) {
            value = newValue;
            handlers.forEach((handler: any) => handler(value, changedBits));
        },
        context,
    };
}
function objectIs(x: any, y: any) {
    if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

export function createContext(defaultValue: any, calculateChangedBits?: (a: any, b: any) => number) {
    const context = {};
    class Provider extends Component<any, any> {
        public emitter = createEventEmitter(this.props.value, context);
        constructor(p: any, c: any) {
            super(p, c);
        }
        public getChildContext() {
            const provider = this.emitter;
            let providers = this.context.providers;
            if (providers) {
                providers.push(provider);
            } else {
                providers = [provider];
            }
            return { providers };
        }
        public componentWillReceiveProps(nextProps: any) {
            const oldValue = this.props.value;
            const newValue = nextProps.value;
            let changedBits: number;
            if (objectIs(oldValue, newValue)) {
                changedBits = 0;
            } else {
                changedBits = typeof calculateChangedBits === "function"
                    ? calculateChangedBits(oldValue, newValue) : 1073741823;
                changedBits |= 0;
                if (changedBits) {
                    this.emitter.set(nextProps.value, changedBits);
                }
            }
        }
        public render() {
            return this.props.children;
        }
    }
    class Consumer extends Component<any, any> {
        public emitter: any;
        public observedBits: number = 0;
        constructor(p: any, c: any) {
            super(p, c);
            this.updateContext = this.updateContext.bind(this);
            if (c.providers) {
                for (let i = c.providers.length - 1; i >= 0; i--) {
                    const provider = c.providers[i];
                    if (provider.context === context) {
                        this.emitter = provider;
                        this.state = {
                            value: this.getValue(),
                        };
                    }
                }
            }
        }
        public componentDidMount() {
            const c = this.context;
            if (c.providers && c.providers.length) {
                for (let i = c.providers.length - 1; i >= 0; i--) {
                    const provider = c.providers[i];
                    if (provider.context === context) {
                        this.emitter = provider;
                    }
                }
            }
            if (this.emitter) {
                this.emitter.on(this.updateContext);
            }
            const { observedBits } = this.props;
            this.observedBits =
                observedBits === undefined
                || observedBits === null
                ? 1073741823 // Subscribe to all changes by default
                : observedBits;
        }
        public updateContext(val: any, changedBits: number) {
            const observedBits: number = this.observedBits | 0;
            if ((observedBits & changedBits) !== 0) {
                this.setState({ value: this.getValue() });
            }
        }
        public componentWillUnmount() {
            if (this.emitter) {
                this.emitter.off(this.updateContext);
            }
        }
        public getValue() {
            if (this.emitter) {
                return this.emitter.get();
            } else {
                return defaultValue;
            }
        }
        public render() {
            return this.props.children(this.state.value);
        }
    }
    return {Provider, Consumer, default: defaultValue};
}
