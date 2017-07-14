import { VNode } from "./vnode";

const options: {
    syncComponentUpdates?: boolean;
    debounceRendering?: (render: () => void) => void;
    vnode?: (vnode: VNode) => void;
    event?: (event: Event) => Event;
} = {};

export default options;
