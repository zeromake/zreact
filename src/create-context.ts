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

export function createContext(defaultValue: any, calculateChangedBits?: (a: any, b: any) => number, name?: string) {
    const context = {};
    class Provider extends Component<any, any> {
        public static displayName: string = name ? name + ".Provider" : "Context.Provider";
        public static getDerivedStateFromProps(nextProps: any, previousState: any): null {
            const self: Provider = previousState.self;
            const oldValue = self.props.value;
            const newValue = nextProps.value;
            let changedBits: number;
            if (objectIs(oldValue, newValue)) {
                changedBits = 0;
            } else {
                changedBits = typeof calculateChangedBits === "function"
                    ? calculateChangedBits(oldValue, newValue) : 1073741823;
                changedBits |= 0;
                if (changedBits) {
                    self.emitter.set(nextProps.value, changedBits);
                }
            }
            return null;
        }

        public emitter = createEventEmitter(this.props.value, context);

        constructor(p: any, c: any) {
            super(p, c);
            this.state = {self: this};
        }

        public getChildContext() {
            const provider = this.emitter;
            return { provider };
        }

        public render() {
            return this.props.children;
        }
    }
    class Consumer extends Component<any, any> {
        public static displayName: string = name ? name + ".Consumer" : "Context.Consumer";
        public emitter: any;
        public observedBits: number = 0;
        constructor(p: any, c: any) {
            super(p, c);
            this.updateContext = this.updateContext.bind(this);
            if (c && c.provider != null) {
                if (c.provider.context === context) {
                    this.emitter = c.provider;
                    this.state = {
                        value: this.getValue(),
                    };
                }
            }
        }
        public componentDidMount() {
            const c = this.context;
            if (c && c.provider != null) {
                if (c.provider.context === context) {
                    this.emitter = c.provider;
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
                this.setState({ value: val });
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
