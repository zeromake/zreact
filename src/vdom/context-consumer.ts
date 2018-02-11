import { Component } from "../component";
import { IBaseProps, IReactContext } from "../types";

// console.log(Component);
export default function buildConsumer(ComponentIMP: typeof Component) {
    class Consumer extends ComponentIMP<IBaseProps, any> {
        private _context: IReactContext<any>;
        constructor(p: any, c: any, context: IReactContext<any>) {
            super(p, c);
            this._context = context;
            context.ConsumerChildren.push(this);
        }
        public componentWillUnmount() {
            this._context.ConsumerChildren = this._context.ConsumerChildren.filter((i: any) => i !== this);
        }
        public render() {
            return this.props.children(this._context.currentValue);
        }
    }
    return Consumer;
}
