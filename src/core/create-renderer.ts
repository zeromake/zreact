import { noop, extend } from "./util";
import { IMiddleware, IRenderer, OwnerType } from "./type-shared";
import { IFiber } from "../fiber/type-shared";

export function createRenderer(methods: any): IRenderer {
    return extend(Renderer, methods) as IRenderer;
}

const middlewares: IMiddleware[] = [];
/**
 * 声明一个全局 renderer 对象
 */
export const Renderer: IRenderer = {
    controlledCbs: [],
    mountOrder: 1,
    macrotasks: [],
    boundaries: [],
    onDispose: noop,
    createElement: noop,
    middleware(middleware: IMiddleware) {
        if (middleware.begin && middleware.end) {
            middlewares.push(middleware);
        }
    },
    updateControlled() {},
    fireMiddlewares(begin?: boolean) {
        const method = begin ? "begin" : "end";
        const delta = begin ? -1 : 1;
        let index = begin ? middlewares.length - 1 : 0;
        let obj: IMiddleware | null = null;
        while ((obj = middlewares[index])) {
            obj[method]();
            index += delta;
        }
    },
    currentOwner: null,
};
