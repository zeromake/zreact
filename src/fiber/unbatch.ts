import { Component } from "../core/Component";
import { IBaseProps, VirtualNode, IBaseObject } from "../core/type-shared";

interface IUnbatchProps extends IBaseProps {
    child: VirtualNode[] | VirtualNode;
}

interface IUnbatchState extends IBaseObject {
    child: VirtualNode[] | VirtualNode;
}

export class Unbatch<P extends IUnbatchProps, S extends IUnbatchState> extends Component<P, S> {
    constructor(p: P, c: IBaseObject) {
        super(p, c);
        this.state = {
            child: p.child,
        } as S;
    }
    public render(): VirtualNode[] | VirtualNode {
        return this.state.child;
    }
}
