import { Component } from "./component";
import { IBaseProps, IReactContext } from "./types";
import { Provider, IProviderContext } from "./context-provider";

// console.log(Component);
export class Consumer extends Component<IBaseProps, any> {
    public static displayName = "Context.Consumer";
    private _context: IReactContext<any>;
    private _provider?: Provider;
    private popConsumer?: (update: (value: any) => void) => void;
    constructor(p: IBaseProps, c: any, context: IReactContext<any>) {
        super(p, c);
        this._context = context;
        this.updateContext = this.updateContext.bind(this);
        this.pushMount();
    }
    public pushMount() {
        let flag = false;
        const $providers: IProviderContext[] = this.context.$providers;
        if ($providers) {
            for (let i = $providers.length - 1; i >= 0 ; i--) {
                const provider: IProviderContext = $providers[i];
                if (provider.c === this._context) {
                    this.popConsumer = provider.pop;
                    this.state = {
                        value: provider.push(this.updateContext),
                    };
                    flag = true;
                    break;
                }
            }
        }
        if (!flag) {
            console.warn("parent not has Provider");
        }
    }
    public updateContext(value: any) {
        this.setState({ value });
    }
    public componentWillUnmount() {
        if (this.popConsumer) {
            this.popConsumer(this.updateContext);
        }
    }
    public render() {
        return this.props.children(this.state.value);
    }
}
