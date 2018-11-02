import { IFiber } from "./type-shared";
import { EffectTag } from "./effect-tag";
import { IOwnerAttribute } from "../core/type-shared";

/**
 * 查找它后面的节点
 */
export function getInsertPoint(fiber: IFiber) {
    const parent = fiber.parent;
    while (fiber) {
        if ((fiber.stateNode === parent) || fiber.isPortal) {
            return null;
        }
        const forward = findForward(fiber);
        if (forward) {
            return forward;
        }
        fiber = fiber.return;
    }
}

export function setInsertPoints(children: {[key: string]: IFiber}) {
    for (const i in children) {
        const child = children[i];
        if (child.disposed) {
            continue;
        }
        if (child.tag > 4) {
            const p = child.parent;
            child.effectTag = EffectTag.PLACE;
            child.forwardFiber = (p as IOwnerAttribute).insertPoint;
            (p as IOwnerAttribute).insertPoint = child;
            for (
                let pp = child.return;
                pp && pp.effectTag === EffectTag.NOWORK;
                pp = pp.return
            ) {
                pp.effectTag = EffectTag.WORKING;
            }
        } else {
            if (child.child) {
                setInsertPoints(child.children);
            }
        }
    }
}

function findForward(fiber: IFiber): IFiber {
    let forward: IFiber;
    while (fiber.forward) {
        fiber = fiber.forward;
        if (fiber.disposed || fiber.isPortal) {
            continue;
        }
        if (fiber.tag > 3) {
            return fiber;
        }
        if (fiber.child) {
            forward = downward(fiber);
            if (forward) {
                return forward;
            }
        }
    }
    return forward;
}

function downward(fiber: IFiber): IFiber {
    let found;
    while (fiber.lastChild) {
        fiber = fiber.lastChild;
        if (fiber.disposed || fiber.isPortal) {
            return;
        }
        if (fiber.tag > 3) {
            return fiber;
        }
        if (fiber.forward) {
            found = findForward(fiber);
            if (found) {
                return found;
            }
        }
    }
}
