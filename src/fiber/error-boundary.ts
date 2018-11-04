import { EffectTag } from "./effect-tag";
import { IFiber } from "./type-shared";
import { fakeUpdater, noop } from "../core/util";
import { Renderer } from "../core/create-renderer";
import { OwnerType } from "../core/type-shared";

export function pushError(fiber: IFiber, hook: string, error?: any) {
    const names: string[] = [];
    const boundary = findCatchComponent(fiber, names, hook);
    const stack: string = describeError(names, hook);
    if (boundary) {
        if (fiber.hasMounted) {
            // 已经插入
        } else {
            fiber.stateNode = {
                updater: fakeUpdater,
            } as any;
            fiber.effectTag = EffectTag.NOWORK;
        }

        const values = boundary.capturedValues || (boundary.capturedValues = []);
        values.push(error, {
            componentStack: stack,
        });
    } else {
        let p = fiber.return;
        for (const i in p.children) {
            if (p.children[i] === fiber) {
                fiber.type = noop;
            }
        }
        while (p) {
            p.$hydrating = false;
            p = p.return;
        }

        if (!Renderer.catchError) {
            Renderer.catchStack = stack;
            Renderer.catchError = error;
        }
    }
}

function describeError(names: string[], hook: string): string {
    const segments = [`**${hook}** method occur error `];
    names.forEach((name: string, i: number) => {
        if (names[i + 1]) {
            segments.push("in " + name + " (created By " + names[i + 1] + ")");
        }
    });
    return segments.join("\n\r").trim();
}

function findCatchComponent(fiber: IFiber, names: string[], hook: string): IFiber {
    let instance: OwnerType;
    let name: string;
    const topFiber = fiber;
    let retry: IFiber;
    let boundary: IFiber;

    while (fiber) {
        name = fiber.name;
        if (fiber.tag < 4) {
            names.push(name);
            instance = fiber.stateNode || {};

            if ((instance as any).componentDidCatch && !boundary) {
                // boundary不能等于出错组件，不能已经处理过错误
                if (!fiber.caughtError && topFiber !== fiber) {
                    boundary = fiber;
                } else if (fiber.caughtError) {
                    retry = fiber;
                }
            }
        } else if (fiber.tag === 5) {
            names.push(name);
        }

        fiber = fiber.return;
        if (boundary) {
            const boundaries = Renderer.boundaries;

            if (!retry || retry !== boundary) {
                const effectTag = boundary.effectTag;
                // 防止被多次回滚
                // console.log("捕捉",boundary.name, hook);
                const f = boundary.alternate;
                if (f && !f.catchError) {
                    f.forward = boundary.forward;
                    f.sibling = boundary.sibling;
                    if (boundary.return.child === boundary) {
                        boundary.return.child = f;
                    }
                    boundary = f;
                }
                // 防止被多次重置children, oldChildren, effectTag
                if (!boundary.catchError) {
                    if (
                        hook === "componentWillUnmount" ||
                        hook === "componentDidUpdate"
                    ) {
                        boundary.effectTag = EffectTag.CAPTURE;
                    } else {
                        boundary.effectTag = effectTag * EffectTag.CAPTURE;
                    }
                    // 防止被重复添加
                    boundaries.unshift(boundary);
                    boundary.catchError = true;
                }

                // 边界组件在没有componentDidCatch之前（以caughtError为标识），可以捕捉多个冒泡上来的组件
                if (retry) {
                    const effects = boundary.effects || (boundary.effects = []);
                    effects.push(retry);
                }
            }
            return boundary;
        }
    }
}

export function removeFormBoundaries(fiber: IFiber): void {
    delete fiber.catchError;
    const boundaries = Renderer.boundaries;
    const index = boundaries.indexOf(fiber);
    if (index !== -1) {
        boundaries.splice(index, 1);
    }
}

export function detachFiber(fiber: IFiber, effects: IFiber[]): void {
    fiber.effectTag = EffectTag.DETACH;
    effects.push(fiber);

    fiber.disposed = true;
    for (let child = fiber.child; child; child = child.sibling) {
        detachFiber(child, effects);
    }
}

export function guardCallback(host: OwnerType, hook: string, args: any[]) {
    try {
        return applyCallback(host, hook, args);
    } catch (error) {
        pushError(host.$reactInternalFiber, hook, error);
    }
}

export function applyCallback(host: OwnerType, hook: string, args: any[]) {
    const fiber: IFiber = host.$reactInternalFiber;
    fiber.errorHook = hook;
    const fn = host[hook];
    if (hook === "componentWillUnmount") {
        host[hook] = noop;
    }
    if (fn) {
        return fn.apply(host, args);
    }
    return true;
}
