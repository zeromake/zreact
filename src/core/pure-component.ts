import { Component, IBaseProps } from "./component";
import { IBaseObject } from "./util";
import { shallowEqual } from "./shallow-equal";

export class PureComponent<P extends IBaseProps, S extends IBaseObject > extends Component<P, S> {
    public isPureComponent: boolean = true;

    public shouldComponentUpdate(nextProps: P, nextState: S, nextContext: IBaseObject): boolean {
        const a = shallowEqual(this.props, nextProps);
        const b = shallowEqual(this.state, nextState);
        return !a || !b;
    }
}
