import { Component } from "./component";
import { IBaseProps, IKeyValue, RefType } from "./types";

interface IForwardRefProps extends IBaseProps {
    "$$forwardedRef"?: RefType;
}

export class ForwardRef extends Component<IForwardRefProps, IKeyValue> {
    public static displayName = "ForwardRef";
    public static $isForwardRefComponent: boolean = true;
    public $$render?: (props: any, ref: any) => any;
    public render() {
        const { $$forwardedRef, ...props } = this.props;
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
