import { Renderer } from "../core/create-renderer";
import { IOwnerAttribute, IComponentMinx, IBaseObject, IBaseProps } from "../core/type-shared";

export function useState<T>(state: T): [T, (s: T) => void] {
    const owner = Renderer.currentOwner as IOwnerAttribute;
    if (typeof state === "function") {
        state = state.call(owner);
    }
    if (!owner) {
        return [state, () => {}];
    }
    const hooks = initHook(owner);
    const index = hooks.index;
    let update: (s: T) => void;
    if (index >= hooks.length) {
        hooks.length++;
        update = (s: T) => {
            const old = hooks.states[index];
            if (typeof s === "function") {
                s = s.call(owner, old);
            }
            hooks.states[index] = s;
            owner.updater!.enqueueSetState(owner, false);
        };
        hooks.states[index] = state;
        hooks.calls[index] = update;
    } else {
        update = hooks.calls[index];
        state = hooks.states[index];
    }
    return [state, update];
}

export function useRef<T>(state: T): {current: T} {
    const owner = Renderer.currentOwner as IOwnerAttribute;
    if (!owner) {
        return { current: state };
    }
    let ref;
    const hooks = initHook(owner);
    const index = hooks.index;
    if (index >= hooks.length) {
        hooks.length++;
        ref = hooks.states[index] = { current: state };
    } else {
        ref = hooks.states[index];
    }
    return ref;
}

function initHook(owner: IOwnerAttribute) {
    if (!owner.$$useHook) {
        owner.$$useHook = {
            index: -1,
            length: 0,
            states: [],
            calls: [],
        };
    }
    owner.$$useHook.index++;
    return owner.$$useHook;
}

export function resetHook(owner: IOwnerAttribute) {
    if (owner.$$useHook) {
        owner.$$useHook.index = -1;
    }
}

export function useEffect(didUpdate: () => void|(() => void)) {
    const owner = Renderer.currentOwner as IComponentMinx<IBaseProps, IBaseObject>;
    if (!owner || !didUpdate) {
        return;
    }
    const ownerDidUpdate = function _ownerDidUpdate() {
        const willUnmount = didUpdate();
        if (willUnmount) {
            owner.componentWillUnmount = willUnmount;
        }
    };
    owner.componentDidMount = ownerDidUpdate;
    owner.componentDidUpdate = ownerDidUpdate;
}
