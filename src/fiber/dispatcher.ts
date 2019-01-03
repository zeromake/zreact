import { Renderer } from "../core/create-renderer";
import { OwnerType, IRefType, IBaseObject, IProvider } from "../core/type-shared";
import { IFiber, effectType } from "./type-shared";
import {
    EffectTag,
} from "./effect-tag";
import { isFn } from "../core/util";

function setter<T>(this: IFiber, compute: (cur: string, val?: T) => T, cursor: string, value?: T): void {
    this.updateQueue!.hook[cursor] = compute(cursor, value);
    Renderer.updateComponent!(this, true);
}
let hookCursor = 0;

export function resetCursor(): void {
    hookCursor = 0;
}

function getCurrentFiber(): IFiber {
    return Renderer.currentOwner!.$reactInternalFiber!;
}

function areHookInputsEqual(arr1: any[], arr2: any[]): boolean {
    for (let i = 0; i < arr1.length; i++) {
        if (Object.is(arr1[i], arr2[i])) {
            continue;
        }
        return false;
    }
    return true;
}

export const dispatcher = {
    useContext<T>(context: typeof IProvider): T {
        const fiber = getCurrentFiber();
        const providerFiber = context.getContext(fiber);
        if (providerFiber) {
            const instance = providerFiber.stateNode as IProvider<T>;
            if (instance.subscribers.indexOf(fiber) !== -1) {
                instance.subscribers.push(fiber);
            }
            return instance.value;
        }
        return context.defaultValue;
    },
    useReducer<T, F>(reducer: ((val: T, action: F) => T) | null, initValue: T, initAction?: F): [T, (val?: T) => void] {
        const fiber = getCurrentFiber();
        const key = "Hook." + hookCursor;
        const updateQueue = fiber.updateQueue!.hook;
        hookCursor++;
        const compute = reducer ? function _compute(cursor: string, action: F) {
            return reducer(updateQueue[cursor], action || { type: Math.random() } as any) as T;
        } : function _compute(cursor: string, newValue: T | ((val: T) => T)): T {
            if (isFn(newValue)) {
                const novel: T = updateQueue[cursor];
                return (newValue as (val: T) => T)(novel);
            }
            return newValue as T;
        };
        const dispatch = setter.bind(fiber, compute as any, key);
        if (key in updateQueue) {
            delete fiber.updateQueue!.isForced;
            return [updateQueue[key], dispatch];
        }
        const value = updateQueue[key] = initAction && reducer ? reducer!(initValue, initAction) : initValue;
        return [value, dispatch];
    },
    useCallbackOrMemo<T>(create: T | (() => T), inputs?: string[], isMemo?: boolean) {
        const fiber = getCurrentFiber();
        const key = "Hook." + hookCursor;
        const updateQueue = fiber.updateQueue!.hook;
        hookCursor++;

        const nextInputs = Array.isArray(inputs) ? inputs : [create];
        const prevState = updateQueue[key];
        if (prevState) {
            const prevInputs = prevState[1];
            if (areHookInputsEqual(nextInputs, prevInputs)) {
                return prevState[0];
            }
        }

        const value: T = isMemo ? (create as any)() : create;
        updateQueue[key] = [value, nextInputs];
        return value;
    },
    useRef<T>(initValue: T) {
        const fiber = getCurrentFiber();
        const key = "Hook." + hookCursor;
        const updateQueue = fiber.updateQueue!.hook;
        hookCursor++;
        if (key in updateQueue) {
            return updateQueue[key];
        }
        return updateQueue[key] = {
            current: initValue,
        };
    },
    useEffect(create: effectType, inputs: string[]|undefined, effectTag: number, createList: "layout" | "passive", destoryList: "unlayout" | "unpassive"): void {
        const fiber = getCurrentFiber();
        const cb = dispatcher.useCallbackOrMemo(create, inputs);
        if (fiber.effectTag % effectTag) {
            fiber.effectTag *= effectTag;
        }
        const updateQueue = fiber.updateQueue!;
        const list = updateQueue[createList] ||  (updateQueue[createList] = []);
        if (!updateQueue[destoryList]) {
            updateQueue[destoryList] = [];
        }
        list.push(cb);
    },
    useImperativeMethods(ref: IRefType, create: () => IBaseObject, inputs?: any[]) {
        const nextInputs: string[] = Array.isArray(inputs) ? inputs.concat([ref])
            : [ref, create];
        dispatcher.useEffect(() => {
            if (typeof ref === "function") {
                const refCallback = ref;
                const inst = create();
                refCallback(inst);
                return () => refCallback(null);
            } else if (ref !== null && ref !== undefined) {
                const refObject = ref;
                const inst = create();
                (refObject as any).current = inst;
                return () => {
                    (refObject as any).current = null;
                };
            }
        }, nextInputs, EffectTag.PASSIVE, "passive", "unpassive");
    },
};
