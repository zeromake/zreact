import {
    fakeUpdater,
    returnFalse,
    emptyObject,
} from "../core/util";
import {
    EffectTag,
    effectLength,
    effectNames,
} from "./effect-tag";
import {
    guardCallback,
    removeFormBoundaries,
} from "./error-boundary";
import { Renderer } from "../core/create-renderer";
import { Refs } from "./Refs";
import { IFiber } from "./type-shared";
import {
    OwnerType,
    IComponentMinx,
    IUpdater,
} from "../core/type-shared";

import { options } from "./options";

/**
 * COMMIT阶段也做成深度调先遍历
 */
const domFns = ["insertElement", "updateContent", "updateAttribute"];
const domEffects: EffectTag[] = [EffectTag.PLACE, EffectTag.CONTENT, EffectTag.ATTR];
const domRemoved: IFiber[] = [];

function commitDFSImpl(fiber: IFiber) {
    const topFiber = fiber;
    outerLoop: while (true) {
        // 逐步向下执行所有移除与插入操作
        if (fiber.effects && fiber.effects.length) {
            // fiber里面是被重用的旧节点与无法重用的旧节点
            fiber.effects.forEach(disposeFiber);
            delete fiber.effects;
        }
        if (fiber.effectTag % EffectTag.PLACE === 0) {
            // DOM节点插入或移除
            domEffects.forEach(function _(effect, i) {
                if (fiber.effectTag % effect === 0) {
                    (Renderer as any)[domFns[i]](fiber);
                    fiber.effectTag /= effect;
                }
            });
            fiber.hasMounted = true;
        } else {
            // 边界组件的清洗工件
            if (fiber.catchError) {
                removeFormBoundaries(fiber);
                disposeFibers(fiber);
            }
        }
        if (fiber.updateFail) {
            delete fiber.updateFail;
        }
        if (fiber.child && fiber.child.effectTag > EffectTag.NOWORK) {
            fiber = fiber.child;
            continue;
        }

        let f: IFiber|undefined = fiber;
        while (f) {
            if (f.effectTag === EffectTag.WORKING) {
                f.effectTag = EffectTag.NOWORK;
            } else if (f.effectTag > EffectTag.WORKING) {
                commitEffects(f);
                if (f.capturedValues) {
                    f.effectTag = EffectTag.CAPTURE;
                }
            }

            if (f === topFiber || f.hostRoot) {
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

export function commitDFS(effects: IFiber[]) {
    Renderer.batchedUpdates!(function _() {
        let el;
        while ((el = effects.shift())) {
            // 处理retry组件
            if (el.effectTag === EffectTag.DETACH && el.caughtError) {
                disposeFiber(el);
            } else {
                commitDFSImpl(el);
            }
            if (domRemoved.length) {
                domRemoved.forEach(Renderer.removeElement!);
                domRemoved.length = 0;
            }
        }
    }, {});
    const error = Renderer.catchError;
    if (error) {
        delete Renderer.catchError;
        throw error;
    }
}

/**
 * 执行其他任务
 * @param fiber
 */
export function commitEffects(fiber: IFiber) {
    const instance: OwnerType = fiber.stateNode || emptyObject;
    let amount = fiber.effectTag;
    const updater = instance.updater || fakeUpdater;
    for (let i = 0; i < effectLength; i++) {
        const effectNo = effectNames[i];
        if (effectNo > amount) {
            break;
        }
        if (amount % effectNo === 0) {
            amount /= effectNo;
            // 如果能整除
            switch (effectNo) {
                case EffectTag.WORKING:
                    break;
                case EffectTag.DUPLEX:
                    Renderer.updateControlled(fiber);
                    break;
                case EffectTag.HOOK:
                    if (fiber.hasMounted) {
                        guardCallback(instance, "componentDidUpdate", [
                            updater.prevProps,
                            updater.prevState,
                            updater.snapshot,
                        ]);
                        if (options.afterUpdate) {
                            options.afterUpdate(instance);
                        }
                    } else {
                        fiber.hasMounted = true;
                        if (options.afterMount) {
                            options.afterMount(instance);
                        }
                        guardCallback(instance, "componentDidMount", []);
                    }
                    delete fiber.$hydrating;
                    // 这里发现错误，说明它的下方组件出现错误，不能延迟到下一个生命周期
                    if (fiber.catchError) {
                        fiber.effectTag = amount;
                        return;
                    }
                    break;
                case EffectTag.REF:
                    Refs.fireRef(fiber, instance);
                    break;
                case EffectTag.CALLBACK:
                    // ReactDOM.render/forceUpdate/setState callback
                    const queue = fiber.pendingCbs as Array<(this: OwnerType) => void>;
                    fiber.$hydrating = true; // setState回调里再执行setState
                    queue.forEach(function _(fn) {
                        fn.call(instance);
                    });
                    delete fiber.$hydrating;
                    delete fiber.pendingCbs;
                    break;
                case EffectTag.CAPTURE: // 23
                    const values = fiber.capturedValues as any[];
                    fiber.caughtError = true;
                    const error: Error = values.shift();
                    const stack: {componentStack: string} = values.shift();
                    if (!values.length) {
                        fiber.effectTag = amount;
                        delete fiber.capturedValues;
                    }
                    ((instance as IComponentMinx<any, any>).componentDidCatch as any)(error, stack);
                    break;
            }
        }
    }
    fiber.effectTag = EffectTag.NOWORK;
}

export function disposeFibers(fiber: IFiber) {
    const list = [fiber.oldChildren, fiber.children];
    for (let i = 0; i < 2; i++) {
        const old = list[i];
        if (old) {
            for (const key in old) {
                const child = old[key];
                if (!child.disposed && child.hasMounted) {
                    disposeFiber(child, true);
                    disposeFibers(child);
                }
            }
        }
    }
    delete fiber.child;
    delete fiber.lastChild;
    delete fiber.oldChildren;
    fiber.children = {};
}

function disposeFiber(fiber: IFiber, force?: boolean|number) {
    const { stateNode, effectTag } = fiber;
    if (!stateNode) {
        return;
    }
    if (!stateNode.$isStateless && fiber.ref) {
        Refs.fireRef(fiber, null);
    }
    if (effectTag % EffectTag.DETACH === 0 || force === true) {
        if (fiber.tag > 3) {
            domRemoved.push(fiber);
        } else {
            Renderer.onDispose(fiber);
            if (fiber.hasMounted) {
                (stateNode.updater as IUpdater).enqueueSetState = returnFalse;
                if (options.beforeUnmount) {
                    options.beforeUnmount(stateNode);
                }
                guardCallback(stateNode, "componentWillUnmount", []);
                delete fiber.stateNode;
            }
        }
        delete fiber.alternate;
        delete fiber.hasMounted;
        fiber.disposed = true;
    }
    fiber.effectTag = EffectTag.NOWORK;
}
