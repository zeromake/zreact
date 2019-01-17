import { noop, extend } from "./util";
import { IMiddleware, IRenderer } from "./type-shared";

export function createRenderer<T>(methods: T): IRenderer&T {
    return extend(Renderer, methods);
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
    onBeforeRender: noop,
    onAfterRender: noop,
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
