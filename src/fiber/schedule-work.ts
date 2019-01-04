import { reconcileDFS } from "./begin-work";
import { commitDFS } from "./commit-work";
import { Renderer } from "../core/create-renderer";
import {
    effects,
    resetStack,
    arrayPush,
    isFn,
    topNodes,
    typeNumber,
    topFibers,
    getWindow,
} from "../core/util";
import { Unbatch } from "./unbatch";
import { Fiber } from "./Fiber";

import { createInstance } from "./create-instance";
import { IFiber, IScheduledCallbackParams, IUpdateQueue } from "./type-shared";
import { OwnerType, IVNode, IBaseObject, IWorkContext, IUpdater } from "../core/type-shared";

const macrotasks = Renderer.macrotasks;
const boundaries = Renderer.boundaries;
const batchedtasks: IFiber[] = [];

export function render(vnode: IVNode, root: Element, callback: (this: OwnerType) => void): OwnerType {
    const container = createContainer(root);
    let immediateUpdate = false;
    if (container && !container.hostRoot) {
        const fiber: IFiber = new Fiber({
            type: Unbatch as any,
            tag: 2,
            props: {},
        });
        fiber.hasMounted = true;
        fiber.memoizedState = {};
        fiber.return = container;
        fiber.index = 0;
        container.child = fiber;
        // 将updateClassComponent部分逻辑放到这里，我们只需要实例化它
        const instance = createInstance(fiber, {});
        container.hostRoot = instance as Element;
        immediateUpdate = true;
        Renderer.emptyElement!(container);
    }
    const carrier: {
        instance?: OwnerType,
    } = {};
    updateComponent(
        container!.child!,
        {
            child: vnode,
        },
        wrapCb(callback, carrier),
        immediateUpdate,
    );

    return carrier.instance as OwnerType;
}

function wrapCb(
    fn: (this: OwnerType) => void,
    carrier: {
        instance?: OwnerType,
    },
) {
    return function(this: IFiber) {
        const fiber = this;
        const target = fiber.child ? fiber.child.stateNode : null;
        if (fn && target) {
            fn.call(target);
        }
        carrier.instance = target as OwnerType;
    };
}

function performWork(dl: IScheduledCallbackParams) {
    // 更新虚拟DOM与真实环境
    workLoop(dl);
    // 如果更新过程中产生新的任务（setState与gDSFP），它们会放到每棵树的microtasks
    // 我们需要再做一次收集，不为空时，递归调用

    if (boundaries.length) {
        // 优先处理异常边界的setState
        macrotasks.unshift.apply(macrotasks, boundaries);
        boundaries.length = 0;
    }

    topFibers.forEach(function _(el: IFiber|undefined) {
        const microtasks = (el as IFiber).microtasks as IFiber[];
        while ((el = microtasks.shift())) {
            if (!el.disposed) {
                macrotasks.push(el);
            }
        }
    });
    if (macrotasks.length) {
        requestIdleCallback(performWork);
    }
}
const ENOUGH_TIME = 1;
const deadline: IScheduledCallbackParams = {
    didTimeout: false,
    timeRemaining() {
        return 2;
    },
};

const win = getWindow();

export function requestIdleCallback(fn: (d: IScheduledCallbackParams) => void): number {
    if (typeof (win as any).requestIdleCallback === "function") {
        return (win as any).requestAnimationFrame(function _(start: number) {
            start += 50;
            const opt = {
                didTimeout: false,
                timeRemaining(): number {
                    return start - performance.now();
                },
            };
            return fn(opt);
        });
    } else {
        fn(deadline);
        return 0;
    }
}

Renderer.scheduleWork = function scheduleWork() {
    return requestIdleCallback(performWork);
};

let isBatching = false;

Renderer.batchedUpdates = function batchedUpdates<T, F>(callback: (e: T) => F, event: T): F {
    const keepbook = isBatching;
    isBatching = true;
    try {
        if (event) {
            Renderer.fireMiddlewares(true);
        }
        return callback(event);
    } finally {
        isBatching = keepbook;
        if (!isBatching) {
            let el: IFiber|undefined;
            while ((el = batchedtasks.shift())) {
                if (el && !el.disabled) {
                    macrotasks.push(el);
                }
            }
            if (event) {
                Renderer.fireMiddlewares();
            }
            (Renderer.scheduleWork as any)();
        }
    }
};

function workLoop(dl: IScheduledCallbackParams) {
    const fiber = macrotasks.shift();
    let info: IFiber;
    if (fiber) {
        if (fiber.type === Unbatch) {
            info = fiber.return as IFiber;
        } else {
            const dom = getContainer(fiber);
            info = {
                containerStack: [dom],
                contextStack: [fiber.stateNode && (fiber.stateNode as OwnerType).$unmaskedContext],
            } as IFiber;
        }
        return workLoopImp(fiber, info as IWorkContext, dl);
    }
}

function workLoopImp(fiber: IFiber, info: IWorkContext, dl: IScheduledCallbackParams, topWork?: IFiber) {
    const lastFiber = reconcileDFS(fiber, info as IWorkContext, dl, ENOUGH_TIME, topWork);
    if (topWork) {
        fiber = topWork;
    }
    if (lastFiber) {
        return requestIdleCallback((pdl: IScheduledCallbackParams) => {
            workLoopImp(lastFiber, info, pdl, fiber);
        });
    }
    updateCommitQueue(fiber);
    resetStack(info as IFiber);
    if (macrotasks.length && dl.timeRemaining() > ENOUGH_TIME) {
        workLoop(dl); // 收集任务
    } else {
        commitDFS(effects); // 执行任务
    }
}

function updateCommitQueue(fiber: IFiber) {
    const hasBoundary = boundaries.length > 0;
    if (fiber.type !== Unbatch) {
        // 如果是某个组件更新
        if (hasBoundary) {
            // 如果在reconcile阶段发生异常，那么commit阶段就不会从原先的topFiber出发，而是以边界组件的alternate出发
            arrayPush.apply(effects, boundaries);
        } else {
            effects.push(fiber);
        }
    } else {
        effects.push(fiber);
    }
    boundaries.length = 0;
}

/**
 * 这是一个深度优先过程，beginWork之后，对其孩子进行任务收集，然后再对其兄弟进行类似操作，
 * 没有，则找其父节点的孩子
 * @param fiber
 * @param topWork
 */

function mergeUpdates(fiber: IFiber, state: IBaseObject|((s: IBaseObject) => IBaseObject|null|undefined)|null, isForced: boolean, callback?: () => void): void {
    const updateQueue = fiber.updateQueue as IUpdateQueue;
    if (isForced) {
        updateQueue.isForced = true; // 如果是true就变不回false
    }
    if (state) {
        updateQueue.pendingStates.push(state);
    }
    if (isFn(callback as any)) {
        updateQueue.pendingCbs.push(callback as () => void);
    }
}

function fiberContains(p: IFiber, son: IFiber) {
    while (son.return) {
        if (son.return === p) {
            return true;
        }
        son = son.return;
    }
}

function getQueue(fiber: IFiber|undefined) {
    while (fiber) {
        if (fiber.microtasks) {
            return fiber.microtasks;
        }
        fiber = fiber.return;
    }
}

function pushChildQueue(fiber: IFiber, queue: IFiber[]): void {
    // 判定当前节点是否包含已进队的节点
    const maps: {[index: number]: boolean} = {};
    for (let i = queue.length, el: IFiber; (el = queue[--i]); ) {
        // 移除列队中比它小的组件
        if (fiber === el) {
            queue.splice(i, 1); // 已经放进过，去掉
            continue;
        } else if (fiberContains(fiber, el)) {
            // 不包含自身
            queue.splice(i, 1);
            continue;
        }
        const instance = ((el as IFiber).stateNode as OwnerType);
        maps[(instance.updater as IUpdater).mountOrder] = true;
    }
    let enqueue = true;
    let p = fiber;
    const hackSCU = [];
    while (p.return) {
        p = p.return;
        const instance = p.stateNode as OwnerType;
        if (instance.render && !instance.$isStateless && p.type !== Unbatch) {
            hackSCU.push(p);
            const u = instance.updater as IUpdater;
            if (maps[u.mountOrder]) {
                // 它是已经在列队的某个组件的孩子
                enqueue = false;
                break;
            }
        }
    }
    hackSCU.forEach(function _(el) {
        // 如果是批量更新，必须强制更新，防止进入SCU
        (el.updateQueue as IUpdateQueue).batching = true;
    });
    if (enqueue) {
        queue.push(fiber);
    }
}

/**
 * setState的实现
 */
function updateComponent(
    fiber: IFiber,
    state: IBaseObject | boolean | ((s: IBaseObject) => IBaseObject|null|undefined),
    callback?: () => void,
    immediateUpdate?: boolean,
) {
    // const fiber = instance.$reactInternalFiber as IFiber;
    fiber.dirty = true;

    const sn = typeNumber(state);
    const isForced = state === true;
    const microtasks = getQueue(fiber);

    state = (isForced ? null : sn === 5 || sn === 8 ? state : null) as any;
    if (fiber.setout) {
        // cWM/cWRP中setState， 不放进列队
        immediateUpdate = false;
    } else if ((isBatching && !immediateUpdate) || fiber.$hydrating) {
        // 事件回调，batchedUpdates, 错误边界, cDM/cDU中setState
        pushChildQueue(fiber, batchedtasks);
    } else {
        // 情况4，在钩子外setState或batchedUpdates中ReactDOM.render一棵新树
        immediateUpdate = immediateUpdate || !fiber.$hydrating;
        pushChildQueue(fiber, microtasks as IFiber[]);
    }
    mergeUpdates(fiber, state as IBaseObject|((s: IBaseObject) => IBaseObject|null|undefined)|null, isForced, callback);
    if (immediateUpdate) {
        (Renderer.scheduleWork as any)();
    }
}

Renderer.updateComponent = updateComponent;

function validateTag(el: Element): boolean {
    return el && !!el.appendChild;
}

export function createContainer(root: Element, onlyGet?: boolean, validate?: (el: Element) => boolean): IFiber|null {
    validate = validate || validateTag;
    if (!validate(root)) {
        throw new TypeError(`container is not a element`); // eslint-disable-line
    }

    (root as any).anuProp = 2018;
    const useProp = (root as any).anuProp === 2018;
    // 像IE6-8，文本节点不能添加属性
    if (useProp) {
        (root as any).anuProp = void 0;
        if ((root as any).$reactInternalFiber) {
            return (root as any).$reactInternalFiber;
        }
    } else {
        const index = topNodes.indexOf(root as any) as number;
        if (index !== -1) {
            return topFibers[index];
        }
    }
    if (onlyGet) {
        return null;
    }
    const container: IFiber = new Fiber({
        tag: 5,
        // contextStack的对象 总是它的后面的元素的并集 ［dUcUbUa, cUbUa, bUa, a, {}］
        type: root.nodeName || (root as any).type,
        props: {},
    });
    container.stateNode = root as OwnerType;
    container.name = "hostRoot";
    container.contextStack = [{}];
    container.containerStack = [root as OwnerType];
    container.microtasks = [];

    if (useProp) {
        (root as any).$reactInternalFiber = container;
    }
    topNodes.push(root as any);
    topFibers.push(container);

    return container;
}

export function getContainer(p: IFiber): Element|undefined {
    if (p.parent) {
        return p.parent as Element;
    }
    while ((p = p.return as IFiber)) {
        if (p.tag === 5) {
            return p.stateNode as Element;
        }
    }
}
