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
import {
    OwnerType,
    IBaseProps,
    IBaseObject,
    ChildrenType,
} from "../core/type-shared";

/**
 * 基于DFS遍历虚拟DOM树，初始化vnode为fiber,并产出组件实例或DOM节点
 * 为instance/fiber添加context与parent, 并压入栈
 * 使用再路过此节点时，再弹出栈
 * 它需要对updateFail的情况进行优化
 */
export function reconcileDFS(fiber: IFiber, info: IFiber, deadline: IScheduledCallbackParams, ENOUGH_TIME: number): void {
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

export function updateClassComponent(fiber: IFiber, info: IFiber): void {
    const { type, props } = fiber;
    let instance = fiber.stateNode;
    const { contextStack, containerStack } = info;
    const newContext = getMaskedContext(
        instance,
        (type as any).contextTypes,
        contextStack,
    );
    if (instance == null) {
        fiber.parent = type === Portal ? props.parent : containerStack[0];
        instance = createInstance(fiber, newContext);
        cacheContext(instance, contextStack[0], newContext);
    }

    instance.$reactInternalFiber = fiber; // 更新rIF
    const isStateful = !instance.$isStateless;
    if (isStateful) {
        // 有狀态组件
        const updateQueue = fiber.updateQueue;

        delete fiber.updateFail;
        if (fiber.hasMounted) {
            applybeforeUpdateHooks(
                fiber,
                instance,
                props,
                newContext,
                contextStack,
            );
        } else {
            applybeforeMountHooks(
                fiber,
                instance,
                props,
            );
        }

        if (fiber.memoizedState) {
            instance.state = fiber.memoizedState;
        }
        fiber.batching = updateQueue.batching;
        const cbs = updateQueue.pendingCbs;
        if (cbs.length) {
            fiber.pendingCbs = cbs;
            fiber.effectTag *= EffectTag.CALLBACK;
        }
        if (fiber.ref) {
            fiber.effectTag *= EffectTag.REF;
        }
    } else if (type === Portal) {
        // 无狀态组件中的传送门组件
        containerStack.unshift(fiber.parent);
        fiber.shiftContainer = true;
    }
    // 存放它上面的所有context的并集
    // instance.unmaskedContext = contextStack[0];
    // 设置新context, props, state
    instance.context = newContext;
    fiber.memoizedProps = instance.props = props;
    fiber.memoizedState = instance.state;

    if (instance.getChildContext) {
        let context = instance.getChildContext();
        context = Object.assign({}, contextStack[0], context);
        fiber.shiftContext = true;
        contextStack.unshift(context);
    }

    if (isStateful) {
        if (fiber.parent && fiber.hasMounted && fiber.dirty) {
            fiber.parent.insertPoint = getInsertPoint(fiber);
        }
        if (fiber.updateFail) {
            cloneChildren(fiber);
            fiber.$hydrating = false;
            return;
        }

        delete fiber.dirty;
        fiber.effectTag *= EffectTag.HOOK;
    } else {
        fiber.effectTag = EffectTag.WORKING;
    }

    if (fiber.catchError) {
        return;
    }
    Renderer.onUpdate(fiber);
    fiber.$hydrating = true;
    Renderer.currentOwner = instance;
    const rendered = applyCallback(instance, "render", []);
    diffChildren(fiber, rendered);
}

function updateHostComponent(fiber: IFiber, info: IFiber): void {
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
        fiber.stateNode.insertPoint = null;
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
/**
 * 合并state
 * @param fiber
 * @param nextProps 新的 props
 */
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

/**
 * 应用挂载前钩子
 * @param fiber
 * @param instance 组件实例
 * @param newProps 传入的 props
 */
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

function applybeforeUpdateHooks(
    fiber: IFiber,
    instance: OwnerType,
    newProps: IBaseProps,
    newContext: IBaseObject,
    contextStack: IBaseObject[],
) {
    const oldProps = fiber.memoizedProps;
    const oldState = fiber.memoizedState;
    const updater = instance.updater;
    updater.prevProps = oldProps;
    updater.prevState = oldState;
    const propsChanged = oldProps !== newProps;
    const contextChanged = instance.context !== newContext;
    fiber.setout = true;

    if (!instance.$useNewHooks) {
        if (propsChanged || contextChanged) {
            const prevState = instance.state;
            callUnsafeHook(instance, "componentWillReceiveProps", [
                newProps,
                newContext,
            ]);
            if (prevState !== instance.state) {
                // 模拟replaceState
                fiber.memoizedState = instance.state;
            }
        }
    }
    let newState = (instance.state = oldState);
    const updateQueue = fiber.updateQueue;
    mergeStates(fiber, newProps);
    newState = fiber.memoizedState;

    setStateByProps(instance, fiber, newProps, newState);
    newState = fiber.memoizedState;

    delete fiber.setout;
    fiber.$hydrating = true;
    if (
        !propsChanged &&
        newState === oldState &&
        contextStack.length === 1 &&
        !updateQueue.isForced
    ) {
        fiber.updateFail = true;
    } else {
        const args = [newProps, newState, newContext];
        fiber.updateQueue = UpdateQueue();

        if (
            !updateQueue.isForced &&
            !applyCallback(instance, "shouldComponentUpdate", args)
        ) {
            fiber.updateFail = true;
        } else if (!instance.$useNewHooks) {
            callUnsafeHook(instance, "componentWillUpdate", args);
        }
    }
}

/**
 * 安全的调用组件钩子
 * @param instance 组件实例
 * @param hook 钩子方法名
 * @param params 注入的方法参数
 */
function callUnsafeHook(instance: OwnerType, hook: string, params: any[]) {
    applyCallback(instance, hook, params);
    applyCallback(instance, "UNSAFE_" + hook, params);
}

/**
 * 比较两个 fiber 是否相同
 * @param target 目标 fiber
 * @param b 比较 fiber
 */
function isSameNode(target: IFiber, b: IFiber): boolean {
    return target.type === b.type && target.key === b.key;
}

/**
 * 调用 getDerivedStateFromProps 钩子
 * @param instance 组件实例
 * @param fiber
 * @param nextProps 新的 props
 * @param prevState 当前的 state
 */
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

function cloneChildren(fiber: IFiber) {
    const prev = fiber.alternate;
    if (prev && prev.child) {
        const pc = prev.children;

        const cc = (fiber.children = {});
        fiber.child = prev.child;
        fiber.lastChild = prev.lastChild;
        for (const i in pc) {
            const a = pc[i];
            a.return = fiber; // 只改父引用不复制
            cc[i] = a;
        }
        setInsertPoints(cc);
    }
}

function cacheContext(instance: OwnerType, unmaskedContext: IBaseObject, context: IBaseObject) {
    instance.$unmaskedContext = unmaskedContext;
    instance.$maskedContext = context;
}

function getMaskedContext(instance: OwnerType, contextTypes: IBaseObject, contextStack: IBaseObject[]) {
    if (instance && !contextTypes) {
        return instance.context;
    }
    const context = {};
    if (!contextTypes) {
        return context;
    }

    const unmaskedContext = contextStack[0];
    if (instance) {
        const cachedUnmasked = instance.$unmaskedContext;
        if (cachedUnmasked === unmaskedContext) {
            return instance.$maskedContext;
        }
    }

    for (const key in contextTypes) {
        if (contextTypes.hasOwnProperty(key)) {
            context[key] = unmaskedContext[key];
        }
    }
    if (instance) {
        cacheContext(instance, unmaskedContext, context);
    }
    return context;
}

/**
 * 把 IVNode 转换为 Fiber
 * @param parentFiber 父fiber
 * @param children 子节点列表
 */
function diffChildren(parentFiber: IFiber, children: ChildrenType) {
    let oldFibers = parentFiber.children;
    if (oldFibers) {
        parentFiber.oldChildren = oldFibers;
    } else {
        oldFibers = {};
    }
    const newFibers: {
        [key: string]: IFiber;
    } = fiberizeChildren(children, parentFiber);
    const effects = parentFiber.effects || (parentFiber.effects = []);
    const matchFibers: {[key: string]: IFiber} = {};
    delete parentFiber.child;
    for (const key in oldFibers) {
        const newFiber = newFibers[key];
        const oldFiber = oldFibers[key];
        if (newFiber && newFiber.type === oldFiber.type) {
            matchFibers[key] = oldFiber;
            if (newFiber.key != null) {
                oldFiber.key = newFiber.key;
            }
            continue;
        }
        detachFiber(oldFiber, effects);
    }
    let prevFiber: IFiber;
    let index = 0;
    for (const key in newFibers) {
        let newFiber = newFibers[key];
        const oldFiber = matchFibers[key];
        let alternate: IFiber = null;
        if (oldFiber) {
            if (isSameNode(oldFiber, newFiber)) {
                alternate = new Fiber(oldFiber);
                const oldRef = oldFiber.ref;
                newFiber = extend(oldFiber, newFiber);
                delete newFiber.disposed;
                newFiber.alternate = alternate;
                if (newFiber.ref && newFiber.deleteRef) {
                    delete newFiber.ref;
                    delete newFiber.deleteRef;
                }
                if (oldRef && oldRef !== newFiber.ref) {
                    effects.push(alternate);
                }
                if (newFiber.tag === 5) {
                    newFiber.lastProps = alternate.props;
                }
            } else {
                detachFiber(parentFiber, effects);
            }
        } else {
            newFiber = new Fiber(newFiber);
        }
        newFibers[key] = newFiber;
        (newFibers as any).index = index++;
        newFiber.return = parentFiber;
        if (prevFiber) {
            prevFiber.sibling = newFiber;
            newFiber.forward = prevFiber;
        } else {
            parentFiber.child = newFiber;
            newFiber.forward = null;
        }
        prevFiber = newFiber;
    }
    parentFiber.lastChild = prevFiber;
    if (prevFiber) {
        prevFiber.sibling = null;
    }
}
