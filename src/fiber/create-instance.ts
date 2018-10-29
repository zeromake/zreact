import { IFiber, IUpdateQueue } from "./type-shared";
import { Renderer } from "../core/create-renderer";
import { returnFalse, isMounted, gDSFP, gSBU } from "../core/util";
import { EffectTag } from "./effect-tag";
import { IUpdater, IOwnerAttribute, OwnerType, IComponentFunction, IComponentClass, IComponentMinx, IBaseProps, IBaseObject } from "../core/type-shared";

export function UpdateQueue(): IUpdateQueue {
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
export function createInstance(fiber: IFiber, context: object): OwnerType {
    const updater: IUpdater = {
        mountOrder: Renderer.mountOrder++,
        enqueueSetState: returnFalse,
        isMounted,
    };
    const { props, type, tag, ref } = fiber;
    const isStateless = tag === EffectTag.NOWORK;
    const lastOwn = Renderer.currentOwner;
    let instance: OwnerType;
    fiber.errorHook = "constructor";
    try {
        if (isStateless) {
            instance = {
                $init: true,
                $isStateless: true,
                props,
                context,
                ref,
                renderImpl: type,
                render() {
                    this.renderImpl(this.props);
                },
            };
            Renderer.currentOwner = instance;
            if ((type as any).isForwardComponent) {
                instance.render = function render(this: IOwnerAttribute) {
                    return (type as IComponentFunction)(this.props, this.ref);
                };
            }
            instance.$init = false;
        } else {
            instance = new (type as IComponentClass<IBaseProps, IBaseObject>)(props, context);
        }
    } finally {
        Renderer.currentOwner = lastOwn;
        fiber.stateNode = instance;
        fiber.updateQueue = UpdateQueue();
        instance.$reactInternalFiber = fiber;
        instance.context = context;
        updater.enqueueSetState = Renderer.updateComponent;
        if (type[gDSFP] || (instance as IComponentMinx<IBaseProps, IBaseObject>).getSnapshotBeforeUpdate) {
            instance.$useNewHooks = true;
        }
    }
    return instance;
}
