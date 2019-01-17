import { IFiber } from "./type-shared";
import { EffectTag } from "./effect-tag";
import { OwnerType } from "zreact-core/type-shared";

/**
 * 查找它后面的节点
 */
export function getInsertPoint(fiber: IFiber): IFiber|null {
    const parent = fiber.parent as OwnerType;
    while (fiber) {
        if ((fiber.stateNode === parent) || fiber.isPortal) {
            return null;
        }
        const forward = findForward(fiber);
        if (forward) {
            return forward;
        }
        fiber = fiber.return as IFiber;
    }
    return null;
}

export function setInsertPoints(children: {[key: string]: IFiber}) {
    for (const i in children) {
        const child = children[i] as IFiber;
        if (child.disposed) {
            continue;
        }
        if (child.tag > 4) {
            const p = child.parent as OwnerType;
            child.effectTag = EffectTag.PLACE;
            child.forwardFiber = p.insertPoint as IFiber;
            p.insertPoint = child;
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

function findForward(fiber: IFiber): IFiber|undefined {
    let forward: IFiber|undefined;
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

function downward(fiber: IFiber): IFiber|undefined {
    let found: IFiber|undefined;
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
