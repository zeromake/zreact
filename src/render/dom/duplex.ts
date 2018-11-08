import { typeNumber, emptyObject } from "../../core/util";
import { IFiber } from "../../fiber/type-shared";

function getSafeValue<T>(value: T): T|string {
    switch (typeNumber(value)) {
        case 2:
        case 3:
        case 8:
        case 4:
        case 0:
            return value;
        default:
            // function, symbol are assigned as empty strings
            return "";
    }
}

type valueType = boolean|string|number|Array<boolean|string|number>;
interface IDuplexProps {
    type: string;
    value?: valueType;
    defaultValue?: valueType;
    checked?: boolean;
    defaultChecked?: boolean;
    multiple?: boolean;
    children?: Array<boolean|string|number>;
}

export interface IDuplexElement extends Element {
    $anuSetValue?: boolean;
    $wrapperState?: {
        initialValue: boolean|string|number|Array<boolean|string|number>;
        wasMultiple?: boolean;
    };
    duplexValue?: boolean|string|number|Array<boolean|string|number>;
    $events?: {
        [name: string]: any;
        vnode?: IFiber;
    };
}

function syncValue(dom: Element, name: string, value: string|number|boolean): void {
    (dom as IDuplexElement).$anuSetValue = true; // 抑制onpropertychange
    (dom as any)[name] = value;
    (dom as IDuplexElement).$anuSetValue = false;
}

function setDefaultValue(node: HTMLInputElement, type: string, value: any, isActive?: boolean) {
    if (
        // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
        type !== "number" ||
        !isActive
    ) {
        if (value == null) {
            node.defaultValue = "" + (node as IDuplexElement).$wrapperState!.initialValue;
        } else if (node.defaultValue !== "" + value) {
            node.defaultValue = "" + value;
        }
    }
}

export function updateOptions(
    node: HTMLSelectElement,
    multiple: boolean,
    propValue: string[]|string,
    setDefaultSelected: boolean,
) {
    const options = node.options;

    if (multiple) {
        const selectedValues = propValue;
        const selectedValue: {[name: string]: boolean} = {};
        for (const selected of selectedValues) {
            // Prefix to avoid chaos with special keys.
            selectedValue["$" + selected] = true;
        }
        for (const option of options as any) {
            const selected = selectedValue.hasOwnProperty(
                "$" + (option as any).duplexValue,
            );
            if (option.selected !== selected) {
                option.selected = selected;
            }
            if (selected && setDefaultSelected) {
                option.defaultSelected = true;
            }
        }
    } else {
        // Do not set `select.value` as exact behavior isn't consistent across all
        // browsers for all cases.
        const _selectedValue = "" + propValue;
        let defaultSelected = null;
        for (const option of options as any) {
            if ((option as IDuplexElement).duplexValue === _selectedValue) {
                option.selected = true;
                if (setDefaultSelected) {
                    option.defaultSelected = true;
                }
                return;
            }
            if (defaultSelected === null && !option.disabled) {
                defaultSelected = option; // 存放第一个不为disabled的option
            }
        }
        if (defaultSelected !== null) {
            defaultSelected.selected = true;
        }
    }
}

function textContent(node: HTMLTextAreaElement): string {
    return node.textContent || node.innerText;
}

export const duplexMap = {
    input: {
        init(node: HTMLInputElement, props: IDuplexProps) {
            const defaultValue =
                props.defaultValue == null ? "" : props.defaultValue;
            return ((node as IDuplexElement).$wrapperState = {
                // initialChecked: props.checked != null ? props.checked : props.defaultChecked,
                initialValue: getSafeValue(
                    props.value != null ? props.value : defaultValue,
                ),
            });
        },
        mount(node: HTMLInputElement, props: IDuplexProps, state: any) {
            if (
                props.hasOwnProperty("value") ||
                props.hasOwnProperty("defaultValue")
            ) {
                const stateValue = "" + state.initialValue;
                if (node.value === "" && node.value !== stateValue) {
                    syncValue(node, "value", stateValue);
                }
                node.defaultValue = stateValue;
            }
            const name = node.name;
            if (name !== "") {
                node.name = "";
            }
            node.defaultChecked = !node.defaultChecked;
            node.defaultChecked = !node.defaultChecked;
            if (name !== "") {
                node.name = name;
            }
        },
        update(node: HTMLInputElement, props: IDuplexProps) {
            if (props.checked != null) {
                syncValue(node, "checked", !!props.checked);
            }
            const isActive = node === node.ownerDocument!.activeElement;
            const value = isActive ? node.value : getSafeValue(props.value);
            if (value != null) {
                if (props.type === "number") {
                    if (
                        (value === 0 && node.value === "") ||
                        // tslint-disable-next-line
                        (+node.value) !== (+value)
                    ) {
                        syncValue(node, "value", "" + value);
                    }
                } else if (node.value !== "" + value) {
                    syncValue(node, "value", "" + value);
                }
            }

            if (props.hasOwnProperty("value")) {
                setDefaultValue(node, props.type, value, isActive);
            } else if (props.hasOwnProperty("defaultValue")) {
                setDefaultValue(
                    node,
                    props.type,
                    getSafeValue(props.defaultValue),
                    isActive,
                );
            }

            if (props.checked == null && props.defaultChecked != null) {
                node.defaultChecked = !!props.defaultChecked;
            }
        },
    },
    select: {
        init(node: HTMLSelectElement, props: IDuplexProps) {
            // selec
            const value = props.value as string;
            return ((node as IDuplexElement).$wrapperState = {
                initialValue: value != null ? value : props.defaultValue as string,
                wasMultiple: !!props.multiple,
            });
        },
        mount(node: HTMLSelectElement, props: IDuplexProps) {
            const multiple = (node.multiple = !!props.multiple);
            const value = props.value;
            if (value != null) {
                updateOptions(node, multiple, value as string[], false);
            } else if (props.defaultValue != null) {
                updateOptions(node, multiple, props.defaultValue as string[], true);
            }
        },
        update(node: HTMLSelectElement, props: IDuplexProps) {
            // mount后这个属性没用
            delete (node as any).$wrapperState.initialValue;
            const state = (node as any).$wrapperState;

            const wasMultiple = state.wasMultiple;
            const multiple = (state.wasMultiple = !!props.multiple);
            const value = props.value;
            if (value != null) {
                updateOptions(node, multiple, value as string[], false);
            } else if (wasMultiple !== multiple) {
                // 切换multiple后，需要重新计算
                if (props.defaultValue != null) {
                    updateOptions(node, multiple, props.defaultValue as string[], true);
                } else {
                    // Revert the select back to its default unselected state.
                    updateOptions(node, multiple, multiple ? [] : "", false);
                }
            }
        },
    },
    textarea: {
        init(node: HTMLTextAreaElement, props: IDuplexProps) {
            let initialValue = props.value as string;
            if (initialValue == null) {
                let defaultValue = props.defaultValue as string;
                const children = props.children;
                if (children != null) {
                    // 移除元素节点
                    defaultValue = textContent(node);
                    node.innerHTML = "";
                }
                if (defaultValue == null) {
                    defaultValue = "";
                }
                initialValue = defaultValue;
            }
            // 优先级：value > children(textContent) > defaultValue > ""
            return ((node as IDuplexElement).$wrapperState = {
                initialValue: "" + initialValue,
            });
        },
        mount(node: HTMLTextAreaElement, props: IDuplexProps, state: any) {
            const text: string = textContent(node);
            const stateValue = "" + state.initialValue;
            if (text !== stateValue) {
                syncValue(node, "value", stateValue);
            }
        },
        update(node: HTMLTextAreaElement, props: IDuplexProps) {
            const value = props.value as string;
            if (value != null) {
                const newValue = "" + value;
                if (newValue !== node.value) {
                    syncValue(node, "value", newValue);
                }
                if (props.defaultValue == null) {
                    node.defaultValue = newValue;
                }
            }
            if (props.defaultValue != null) {
                node.defaultValue = props.defaultValue as string;
            }
        },
    },
    option: {
        init() {
        },
        update(node: HTMLOptionElement, props: IDuplexProps) {
            duplexMap.option.mount(node, props);
        },
        mount(node: HTMLOptionElement, props: IDuplexProps) {
            const elems = node.getElementsByTagName("*");
            let n = elems.length;
            let el;
            if (n) {
                for (n = n - 1, el; (el = elems[n--]); ) {
                    node.removeChild(el);
                }
            }
            if ("value" in props) {
                (node as IDuplexElement).duplexValue = node.value = props.value as string;
            } else {
                (node as IDuplexElement).duplexValue = node.text;
            }
        },
    },
};

export function duplexAction(fiber: IFiber) {
    const { stateNode: dom, name, props, lastProps } = fiber;
    const fns = (duplexMap as any)[name];
    if (name !== "option") {
        enqueueDuplex(dom as Element);
    }
    if (!lastProps || lastProps === emptyObject) {
        const state = fns.init(dom, props);
        fns.mount(dom, props, state);
    } else {
        fns.update(dom, props);
    }
}

const duplexNodes: Element[] = [];
export function enqueueDuplex(dom: Element) {
    if (duplexNodes.indexOf(dom) === -1) {
        duplexNodes.push(dom);
    }
}

export function fireDuplex() {
    const radioMap = {};
    if (duplexNodes.length) {
        do {
            const dom = duplexNodes.shift();
            const e = (dom as IDuplexElement).$events;
            const fiber = e && e.vnode;
            if (fiber && !fiber.disposed) {
                const props = fiber.props;
                const tag = fiber.name;
                if (name === "select") {
                    const value = props.value;
                    if (value != null) {
                        updateOptions(dom as HTMLSelectElement, !!props.multiple, value, false);
                    }
                } else {
                    (duplexMap as any)[tag].update(dom, props);
                    const name = props.name;
                    if (
                        props.type === "radio" &&
                        name != null &&
                        !(radioMap as any)[name]
                    ) {
                        (radioMap as any)[name] = 1;
                        collectNamedCousins(dom as Element, name);
                    }
                }
            }
        } while (duplexNodes.length);
    }
}

function collectNamedCousins(rootNode: Element|Node, name: string) {
    let queryRoot = rootNode;
    while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
    }
    const group = (queryRoot as Element).getElementsByTagName("input");
    for (const otherNode of group as any) {
        if (
            otherNode === rootNode ||
            otherNode.name !== name ||
            otherNode.type !== "radio" ||
            otherNode.form !== (rootNode as HTMLInputElement).form
        ) {
            continue;
        }
        enqueueDuplex(otherNode);
    }
}
