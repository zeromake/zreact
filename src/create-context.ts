import { REACT_ELEMENT_TYPE, REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from "./util";
import { VNode } from "./vnode";
import { IReactContext } from "./types";

export function createContext<T>(defaultValue: T, calculateChangedBits?: ((a: T, b: T) => number)| null): IReactContext<T> {
    if (calculateChangedBits == null) {
        calculateChangedBits = null;
    }
    const context: IReactContext<T> = {
        $$typeof: REACT_CONTEXT_TYPE,
        calculateChangedBits,
        defaultValue,
        currentValue: defaultValue,
        changedBits: 0,
        ConsumerChildren: [],
        Provider: null as any,
        Consumer: null as any,
    };
    context.Provider = {
        $$typeof: REACT_PROVIDER_TYPE,
        context,
    };
    context.Consumer = context;
    return context;
}
