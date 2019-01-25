import { IFiber, IUpdateQueue } from "./type-shared";
import { Renderer } from "zreact-core/create-renderer";
import { returnFalse, isMounted, gDSFP, gSBU } from "zreact-core/util";
import { EffectTag } from "./effect-tag";
import { IUpdater, IOwnerAttribute, OwnerType, IComponentFunction, IComponentClass, IComponentMinx, IBaseProps, IBaseObject } from "../core/type-shared";

export function UpdateQueue(): IUpdateQueue {
    return {
        pendingStates: [],
        pendingCbs: [],
        layout: null,
        unlayout: null,
        passive: null,
        unpassive: null,
        hook: {},
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
    let instance: OwnerType|undefined;
    // 移动设置属性到最前面
    fiber.updateQueue = UpdateQueue();
    fiber.errorHook = "constructor";
    // 去掉 try 让 constructor 触发 error hook
    // try {
    if (isStateless) {
        instance = {
            $init: true,
            $isStateless: true,
            props,
            context,
            ref,
            renderImpl: type as any,
            render(this: IOwnerAttribute) {
                if (this.renderImpl) {
                    return this.renderImpl(this.props as IBaseProps);
                }
                return null;
            },
        } as IOwnerAttribute;
        Renderer.currentOwner = instance;
        if ((type as any).isForwardComponent) {
            instance.render = function render(this: IOwnerAttribute) {
                return (type as IComponentFunction)(this.props as IBaseProps, this.ref);
            };
        }
        instance.$init = false;
    } else {
        instance = new (type as any)(props, context);
    }
    // } finally {
    Renderer.currentOwner = lastOwn;
    fiber.stateNode = instance;
    // fiber.updateQueue = UpdateQueue();
    instance!.$reactInternalFiber = fiber;
    instance!.context = context;
    instance!.updater = updater;
    updater.enqueueSetState = Renderer.updateComponent as any;
    if ((type as any)[gDSFP] || (instance as IComponentMinx<IBaseProps, IBaseObject>).getSnapshotBeforeUpdate) {
        (instance as OwnerType).$useNewHooks = true;
    }
    // }
    return (instance as OwnerType);
}
