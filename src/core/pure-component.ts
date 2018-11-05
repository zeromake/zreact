import { Component } from "./component";
import { shallowEqual } from "./shallow-equal";
import { IBaseObject, IBaseProps } from "./type-shared";

/**
 * 对于简单 state 可以自动优化无用的更改
 */
export class PureComponent<P extends IBaseProps, S extends IBaseObject > extends Component<P, S> {
    public isPureComponent?: boolean;

    public shouldComponentUpdate(nextProps: P, nextState: S, nextContext: IBaseObject): boolean {
        const a = shallowEqual(this.props, nextProps);
        const b = shallowEqual(this.state, nextState);
        return !a || !b;
    }
}
PureComponent.prototype.isPureComponent = true;
