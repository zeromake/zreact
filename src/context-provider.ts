import { Component } from "./component";
import { IBaseProps, IReactProvider, IReactContext } from "./types";
import { Consumer } from "./context-consumer";

interface IProps extends IBaseProps {
    value: any;
}
export interface IProviderContext {
    push: (updateContext: (value: any) => void) => any;
    pop: (updateContext: (value: any) => void) => void;
    c: IReactContext<any>;
}

function objectIs(x: any, y: any): boolean {
    if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

export class Provider extends Component<IProps, any> {
    public static displayName = "Context.Provider";
    public static getDerivedStateFromProps(nextProps: IProps, previousState: any) {
        const value = nextProps.value;
        const self: Provider = previousState.self;
        const oldValue = previousState.value;
        if (self._context.calculateChangedBits) {
            if (self._context.calculateChangedBits(oldValue, value)) {
                self._context.changedBits += 1;
                self.updateConsumerd(value);
            }
        } else if (!objectIs(oldValue, value)) {
            self.updateConsumerd(value);
        }
        return { value };
    }
    public subscribers: Array<(value: any) => void>;
    public _context: IReactContext<any>;
    constructor(p: IProps, c: any, context: IReactProvider<any>) {
        super(p, c);
        this._context = context.context;
        this.subscribers = [];
        this.pushConsumer = this.pushConsumer.bind(this);
        this.popConsumer = this.popConsumer.bind(this);
        let value = null;
        if ("value" in p) {
            value = p.value;
        } else {
            value = this._context.defaultValue;
        }
        this.state = {
            self: this,
            value,
        };
    }
    public getChildContext() {
        let $providers: IProviderContext[] = this.context.$providers;
        const provider: IProviderContext = {
            push: this.pushConsumer,
            pop: this.popConsumer,
            c: this._context,
        };
        if ($providers) {
            $providers.push(provider);
        } else {
            $providers = [provider];
        }
        return {$providers};
    }
    public pushConsumer(subscriber: (value: any) => void) {
        this.subscribers.push(subscriber);
        return this.state.value;
    }
    public popConsumer(subscriber: (value: any) => void) {
        this.subscribers = this.subscribers.filter((i) => i !== subscriber);
    }
    public componentWillUnmount() {
        this._context.changedBits = 0;
        this.subscribers = [];
    }
    // public componentWillReceiveProps(nextProps: IProps) {
    //     Provider.getDerivedStateFromProps(nextProps, this.state);
    // }
    public render() {
        return this.props.children;
    }
    private updateConsumerd(value: any) {
        this.subscribers.forEach((child) => {
            if (child) {
                child(value);
            }
        });
    }
}
