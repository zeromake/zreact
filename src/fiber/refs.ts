import { pushError } from "./error-boundary";
import { typeNumber } from "../core/util";
import { IRefFun, RefElement, IObjectRef } from "../core/type-shared";
import { IFiber } from "./type-shared";

export let Refs = {
    fireRef(fiber: IFiber, dom: RefElement) {
        const ref = fiber.ref;
        const owner = fiber.$owner;
        try {
            const refType = typeNumber(ref);
            const refCall = refStrategy[refType];
            refCall(owner, ref, dom);
            if (owner && owner.$isStateless) {
                delete fiber.ref;
                fiber.deleteRef = true;
            }
        } catch (e) {
            pushError(fiber, "ref", e);
        }
    },
};

const refStrategy = {
    // [4](owner, ref, dom) {
    //     // string
    //     if (dom === null) {
    //         delete owner.refs[ref];
    //     } else {
    //         owner.refs[ref] = dom;
    //     }
    // },
    [5](_, ref: IRefFun, dom: RefElement) {
        ref(dom);
    },
    [8](_, ref: IObjectRef, dom: RefElement) {
        ref.current = dom;
    },
};
