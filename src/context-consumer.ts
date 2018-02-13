import { Component } from "./component";
import { IBaseProps, IReactContext } from "./types";
import { Provider } from "./context-provider";

// console.log(Component);
export class Consumer extends Component<IBaseProps, any> {
    public static displayName = "Context.Consumer";
    private _context: IReactContext<any>;
    private _provider?: Provider;
    constructor(p: IBaseProps, c: any, context: IReactContext<any>) {
        super(p, c);
        this._context = context;
        this.state = {
            value: this._context.currentValue,
        };
        this.updateContext = this.updateContext.bind(this);
        this.pushMount();
    }
    public componentDidMount() {
        if (!this._provider) {
            console.warn("parent not has Provider");
        }
    }
    public pushMount() {
        let parent = this._parentComponent as Provider;
        while (parent) {
            if (parent._context === this._context) {
                parent.pushConsumer(this.updateContext);
                this._provider = parent;
                break;
            }
            parent = parent._parentComponent as Provider;
        }
        // for (let i = mountProvider.length - 1; i >= 0; i--) {
        //     const provider = mountProvider[i];
        //     if (provider._context === this._context) {
        //         provider.childrenConsumer.push(this.updateContext);
        //         this._provider = provider;
        //         break;
        //     }
        // }
    }
    public updateContext(value: any) {
        this.setState({ value });
    }
    public componentWillUnmount() {
        if (this._provider) {
            this._provider.popConsumer(this.updateContext);
        }
    }
    public render() {
        return this.props.children(this.state.value);
    }
}
