import { Component } from "./component";
import { IBaseProps, IReactProvider, IReactContext } from "./types";
import { Consumer } from "./context-consumer";

export let mountProvider: Provider[] = [];
interface IProps extends IBaseProps {
    value: any;
}
export class Provider extends Component<IProps, any> {
    public static displayName = "Context.Provider";
    public static getDerivedStateFromProps(nextProps: IProps, previousState: any): any {
        const value = nextProps.value;
        const self: Provider = previousState.self;
        if (self._context.calculateChangedBits) {
            if (self._context.calculateChangedBits(self._context.currentValue, value)) {
                self._context.changedBits += 1;
                self.updateConsumerd(value);
            }
        } else {
            self.updateConsumerd(value);
        }
        return null;
    }
    public childrenConsumer: Consumer[];
    public _context: IReactContext<any>;
    public value: any;
    public updateConsumer: Consumer[];
    public isChange: boolean;
    constructor(p: IProps, c: any, context: IReactProvider<any>) {
        super(p, c);
        this._context = context.context;
        this.value = p.value;
        this._context.currentValue = p.value;
        this.childrenConsumer = [];
        this.updateConsumer = [];
        this.isChange = false;
        mountProvider.push(this);
        this.state = {
            self: this,
        };
    }
    public componentWillUnmount() {
        this._context.currentValue = this._context.defaultValue;
        this._context.changedBits = 0;
        mountProvider = mountProvider.filter((i) => i !== this);
    }
    // public componentWillReceiveProps(nextProps: IProps) {
    //     Provider.getDerivedStateFromProps(nextProps, this.state);
    // }
    public componentDidUpdate(previousProps: IProps) {
        if (this.isChange) {
            this.childrenConsumer.forEach((child) => {
                if (child && this.updateConsumer.indexOf(child) === -1) {
                    child.isPush = true;
                    child.forceUpdate();
                }
            });
            this.updateConsumer = [];
            this.isChange = false;
        }
    }
    public render() {
        return this.props.children;
    }
    private updateConsumerd(value: any) {
        this._context.currentValue = value;
        this.isChange = true;
    }
}
