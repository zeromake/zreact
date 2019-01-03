import { dispatcher } from "../fiber/dispatcher";
import { effectType } from "../fiber/type-shared";
import { EffectTag } from "../fiber/effect-tag";
import { IRefType, IBaseObject, IProvider } from "./type-shared";

export function useState<T>(initValue: T) {
    return dispatcher.useReducer(null, initValue);
}
export function useReducer<T, F>(reducer: (val: T, action: F) => T, initValue: T, initAction?: T) {
    return dispatcher.useReducer(reducer as any, initValue, initAction);
}

export function useEffect(creare: effectType, inputs?: any[]) {
    return dispatcher.useEffect(creare, inputs, EffectTag.PASSIVE, "passive", "unpassive");
}

export function useCallback(callback: () => void, inputs?: any[]) {
    return dispatcher.useCallbackOrMemo(callback, inputs);
}

export function useMeno(callback: () => void, inputs?: any[]) {
    return dispatcher.useCallbackOrMemo(callback, inputs, true);
}

export function useRef<T>(initValue: T) {
    return dispatcher.useRef(initValue);
}

export function useContext(context: typeof IProvider) {
    return dispatcher.useContext(context);
}

export function useImperativeMethods(ref: IRefType, create: () => IBaseObject, inputs?: any[]) {
    return dispatcher.useImperativeMethods(ref, create, inputs);
}
