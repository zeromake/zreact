import { Component } from "./component";
import { IBaseProps, IReactProvider, IReactContext } from "./types";
import { Consumer } from "./context-consumer";

// export let mountProvider: Provider[] = [];
interface IProps extends IBaseProps {
    value: any;
}

// function pushProvider(provider: Provider) {
//     mountProvider.push(provider);
// }

// function popProvider(provider: Provider) {
//     mountProvider = mountProvider.filter((i) => i !== provider);
// }

export class Provider extends Component<IProps, any> {
    public static displayName = "Context.Provider";
    public static getDerivedStateFromProps(nextProps: IProps, previousState: any): null {
        const value = nextProps.value;
        const self: Provider = previousState.self;
        const oldValue = self.props.value;
        if (self._context.calculateChangedBits) {
            if (self._context.calculateChangedBits(oldValue, value)) {
                self._context.changedBits += 1;
                self.updateConsumerd(value);
            }
        } else if (oldValue !== value) {
            self.updateConsumerd(value);
        }
        return null;
    }
    public subscribers: Array<(value: any) => void>;
    public _context: IReactContext<any>;
    constructor(p: IProps, c: any, context: IReactProvider<any>) {
        super(p, c);
        this._context = context.context;
        this._context.currentValue = p.value;
        this.subscribers = [];
        // pushProvider(this);
        this.state = {
            self: this,
        };
    }
    public pushConsumer(subscriber: (value: any) => void) {
        this.subscribers.push(subscriber);
        return this.props.value;
    }
    public popConsumer(subscriber: (value: any) => void) {
        this.subscribers = this.subscribers.filter((i) => i !== subscriber);
    }
    public componentDidMount() {
        // popProvider();
        if (this.subscribers.length === 0) {
            console.warn("not child Consumer push");
        }
    }
    public componentWillUnmount() {
        this._context.currentValue = this._context.defaultValue;
        this._context.changedBits = 0;
        this.subscribers = [];
        // popProvider(this);
    }
    // public componentWillReceiveProps(nextProps: IProps) {
    //     Provider.getDerivedStateFromProps(nextProps, this.state);
    // }
    public componentDidUpdate(previousProps: IProps) {
        this.componentDidMount();
    }
    public render() {
        return this.props.children;
    }
    private updateConsumerd(value: any) {
        this._context.currentValue = value;
        this.subscribers.forEach((child) => {
            if (child) {
                child(value);
            }
        });
    }
}
