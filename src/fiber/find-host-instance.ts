import { IFiber } from "./type-shared";
import { OwnerType } from "zreact-core/type-shared";

/**
 * 对 fiber 对象或者组件对象查找 dom 对象
 * @param fiber 组件对象，fiber对象
 */
export function findHostInstance(fiber: IFiber | OwnerType): Element | null {
    if (!fiber) {
        return null;
    } else if ((fiber as Element | Node).nodeType) {
        // 如果本身就是 dom 元素之间返回
        return fiber as Element;
    } else if ((fiber as IFiber).tag > 3) {
        // 如果本身是元素节点
        return (fiber as IFiber).stateNode as Element;
    } else if ((fiber as IFiber).tag < 3) {
        return findHostInstance((fiber as IFiber).stateNode as OwnerType);
    } else if ((fiber as OwnerType).render) {
        // react 组件
        fiber = (fiber as OwnerType).$reactInternalFiber as IFiber;
        const childrenMap = (fiber as IFiber).children;
        if (childrenMap) {
            for (const i in childrenMap) {
                const dom = findHostInstance(childrenMap[i]);
                if (dom) {
                    return dom;
                }
            }
        }
    }
    return null;
}
