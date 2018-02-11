import { Component } from "../component";
import { IBaseProps, IReactProvider } from "../types";

interface IProps extends IBaseProps {
    value: any;
}
export default function buildProvider(ComponentIMP: typeof Component) {
    class Provider extends ComponentIMP<IProps, any> {
        private _context: any;
        constructor(p: IProps, c: any, context: IReactProvider<any>) {
            super(p, c);
            this._context = context;
            this._context.context.currentValue = p.value;
        }
        public componentDidUpdate(previousProps: IProps) {
            if (this._context.context.calculateChangedBits) {
                if (this._context.context.calculateChangedBits(this._context.context.currentValue, this.props.value)) {
                    this._context.context.currentValue = this.props.value;
                    this._context.context.changedBits += 1;
                    this._context.context.ConsumerChildren.forEach((child: any) => {
                        if (child) {
                            child.setState({});
                        }
                    });
                }
            }
        }
        public render() {
            return this.props.children;
        }
    }
    return Provider;
}
