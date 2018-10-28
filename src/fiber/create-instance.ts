import { IFiber } from "./type-shared";
import { Renderer } from "../core/create-renderer";
import { returnFalse, isMounted } from "../core/util";
import { EffectTag } from "./effect-tag";

export function UpdateQueue() {
    return {
        pendingStates: [],
        pendingCbs: [],
    };
}
/**
 * 通过 fiber 对象创建 react 组件对象
 * @param fiber
 * @param context 父组件的上下文对象
 */
export function createInstance(fiber: IFiber, context: object) {
    const updater = {
        mountOrder: Renderer.mountOrder++,
        enqueueSetState: returnFalse,
        isMounted,
    };
    const { props, type, tag, ref } = fiber;
    const isStateless = tag === EffectTag.NOWORK;
    const lastOwn = Renderer.currentOwner;

}
