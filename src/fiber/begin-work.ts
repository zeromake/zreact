import { extend, typeNumber, isFn, gDSFP, gSBU } from "../core/util";
import { fiberizeChildren } from "../core/create-element";
import { Portal } from "../core/create-portal";

import { Renderer } from "../core/create-renderer";
import { createInstance, UpdateQueue } from "./create-instance";
import { Fiber } from "./Fiber";
import {
    EffectTag,
} from "./effect-tag";
import {
    guardCallback,
    detachFiber,
    pushError,
    applyCallback,
} from "./error-boundary";
import { getInsertPoint, setInsertPoints } from "./insert-point";
import { IFiber, IScheduledCallbackParams } from "./type-shared";
import { IOwnerAttribute, OwnerType, IBaseProps, IBaseObject } from "../core/type-shared";

/**
 * 基于DFS遍历虚拟DOM树，初始化vnode为fiber,并产出组件实例或DOM节点
 * 为instance/fiber添加context与parent, 并压入栈
 * 使用再路过此节点时，再弹出栈
 * 它需要对updateFail的情况进行优化
 */
export function reconcileDFS(fiber: IFiber, info, deadline: IScheduledCallbackParams, ENOUGH_TIME: number) {
    const topWork = fiber;
    outerLoop: while (fiber) {
        if (fiber.disposed || deadline.timeRemaining() <= ENOUGH_TIME) {
            break outerLoop;
        }
        let occurError;
        if (fiber.tag < 3) {
            const keepbook = Renderer.currentOwner;
            try {
                // 为了性能起见，constructor, render, cWM,cWRP, cWU, gDSFP, render
                // getChildContext都可能 throw Exception，因此不逐一try catch
                // 通过fiber.errorHook得知出错的方法
                updateClassComponent(fiber, info); // unshift context
            } catch (e) {
                occurError = true;
                pushError(fiber, fiber.errorHook, e);
            }
            Renderer.currentOwner = keepbook;
            if (fiber.batching) {
                delete fiber.updateFail;
                delete fiber.batching;
            }
        } else {
            updateHostComponent(fiber, info);
        }
        // 如果没有阻断更新，没有出错
        if (fiber.child && !fiber.updateFail && !occurError) {
            fiber = fiber.child;
            continue outerLoop;
        }
        let f = fiber;
        while (f) {
            const instance: OwnerType = f.stateNode as OwnerType;
            if (f.tag > 3 || f.shiftContainer) {
                if (f.shiftContainer) {
                    // 元素节点与AnuPortal
                    delete f.shiftContainer;
                    info.containerStack.shift(); // shift parent
                }
            } else {
                const updater = instance && instance.updater;
                if (f.shiftContext) {
                    delete f.shiftContext;
                    info.contextStack.shift(); // shift context
                }
                if (f.hasMounted && instance[gSBU]) {
                    updater.snapshot = guardCallback(
                        instance,
                        gSBU,
                        [
                            updater.prevProps,
                            updater.prevState,
                        ],
                    );
                }
            }
            if (f === topWork) {
                break outerLoop;
            }
            if (f.sibling) {
                fiber = f.sibling;
                continue outerLoop;
            }
            f = f.return;
        }
    }
}

function updateHostComponent(fiber: IFiber, info) {
    const { props, tag, alternate: prev } = fiber;

    if (!fiber.stateNode) {
        fiber.parent = info.containerStack[0];
        fiber.stateNode = Renderer.createElement(fiber);
    }
    const parent = fiber.parent;

    fiber.forwardFiber = parent.insertPoint;

    parent.insertPoint = fiber;
    fiber.effectTag = EffectTag.PLACE;
    if (tag === 5) {
        // 元素节点
        (fiber.stateNode as OwnerType).insertPoint = null;
        info.containerStack.unshift(fiber.stateNode);
        fiber.shiftContainer = true;
        fiber.effectTag *= EffectTag.ATTR;
        if (fiber.ref) {
            fiber.effectTag *= EffectTag.REF;
        }
        diffChildren(fiber, props.children);
    } else if (!prev || prev.props !== props) {
        fiber.effectTag *= EffectTag.CONTENT;
    }
}

function mergeStates(fiber: IFiber, nextProps: IBaseProps) {
    const instance = fiber.stateNode;
    const pendings = fiber.updateQueue.pendingStates;
    const n = pendings.length;
    const state = fiber.memoizedState || instance.state;
    if (n === 0) {
        return state;
    }

    const nextState = extend({}, state); // 每次都返回新的state
    let fail = true;
    for (let i = 0; i < n; i++) {
        let pending = pendings[i];
        if (pending) {
            if (isFn(pending)) {
                const a = pending.call(instance, nextState, nextProps);
                if (!a) {
                    continue;
                } else {
                    pending = a;
                }
            }
            fail = false;
            extend(nextState, pending);
        }
    }

    if (fail) {
        return state;
    } else {
        return (fiber.memoizedState = nextState);
    }
}

function applybeforeMountHooks(fiber: IFiber, instance: OwnerType, newProps: IBaseProps): void {
    fiber.setout = true;
    if (instance.$useNewHooks) {
        setStateByProps(instance, fiber, newProps, instance.state);
    } else {
        callUnsafeHook(instance, "componentWillMount", []);
    }
    delete fiber.setout;
    mergeStates(fiber, newProps);
    fiber.updateQueue = UpdateQueue();
}

function callUnsafeHook(instance: OwnerType, hook: string, params: any[]) {
    applyCallback(instance, hook, params);
    applyCallback(instance, "UNSAFE_" + hook, params);
}

function isSameNode(a: IFiber, b: IFiber): boolean {
    return a.type === b.type && a.key === b.key;
}

function setStateByProps(
    instance: OwnerType,
    fiber: IFiber,
    nextProps: IBaseProps,
    prevState: IBaseObject,
) {
    fiber.errorHook = gDSFP;
    const fn = fiber.type[gDSFP];
    if (fn) {
        const partialState: IBaseObject = fn.call(null, nextProps, prevState);
        if (typeNumber(partialState) === 8) {
            fiber.memoizedState = Object.assign({}, prevState, partialState);
        }
    }
}
