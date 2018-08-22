import { Component } from "./component";
import { rest } from "./util";

export class ForwardRef extends Component<any, any> {
    public static displayName = "ForwardRef";
    public static $isForwardRefComponent: boolean = true;
    public $$render?: (props: any, ref: any) => any;
    public render() {
        const { $$forwardedRef } = this.props;
        const props = rest(this.props, ["$$forwardedRef"]);
        if (this.$$render) {
            return this.$$render(props, $$forwardedRef);
        }
        return null;
    }
}

export function forwardRef(render: (props: any, ref: any) => any) {
    class Deep extends ForwardRef {
        public static displayName = (render as any).displayName || (render as any).name || "ForwardRef";
        public $$render = render;
    }
    return Deep;
}
