import { Component } from "./component";
import { IBaseProps, IReactContext } from "./types";
import { mountProvider, Provider } from "./context-provider";

// console.log(Component);
export class Consumer extends Component<IBaseProps, any> {
    public static displayName = "Context.Consumer";
    public isPush: boolean;
    private _context: IReactContext<any>;
    private _provider?: Provider;
    constructor(p: IBaseProps, c: any, context: IReactContext<any>) {
        super(p, c);
        this._context = context;
        this.state = {
            value: this._context.currentValue,
        };
        this.pushMount();
        this.isPush = false;
    }
    public pushMount() {
        for (let i = mountProvider.length - 1; i >= 0; i--) {
            const provider = mountProvider[i];
            if (provider._context === this._context) {
                provider.childrenConsumer.push(this);
                this._provider = provider;
                break;
            }
        }
        // this._context.ConsumerChildren.push(this);
    }
    public componentWillUnmount() {
        if (this._provider) {
            this._provider.childrenConsumer = this._provider.childrenConsumer.filter((i: any) => i !== this);
        }
    }
    public render() {
        if (this.isPush) {
            this.isPush = false;
        } else if (this._provider && this._provider.isChange) {
            this._provider.updateConsumer.push(this);
        }
        return this.props.children(this._context.currentValue);
    }
}
