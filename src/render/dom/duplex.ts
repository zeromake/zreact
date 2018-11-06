import { typeNumber, emptyObject } from "../../core/util";

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

interface IDuplexProps {
    type: string;
    value?: any;
    defaultValue?: any;
    checked?: boolean;
    defaultChecked?: boolean;
    multiple?: boolean;
}
function syncValue(dom: Element, name: string, value: string|number|boolean): void {
    (dom as any).$anuSetValue = true; // 抑制onpropertychange
    dom[name] = value;
    (dom as any).$anuSetValue = false;
}

function setDefaultValue(node: HTMLInputElement, type: string, value: any, isActive?: boolean) {
    if (
        // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
        type !== "number" ||
        !isActive
    ) {
        if (value == null) {
            node.defaultValue = "" + (node as any)._wrapperState.initialValue;
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
        const selectedValue = {};
        for (const selected of selectedValues) {
            // Prefix to avoid chaos with special keys.
            selectedValue["$" + selected] = true;
        }
        for (const option of options) {
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
        for (const option of options) {
            if ((option as any).duplexValue === _selectedValue) {
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

export const duplexMap = {
    input: {
        init(node: HTMLInputElement, props: IDuplexProps) {
            const defaultValue =
                props.defaultValue == null ? "" : props.defaultValue;
            return ((node as any)._wrapperState = {
                // initialChecked: props.checked != null ? props.checked : props.defaultChecked,
                initialValue: getSafeValue(
                    props.value != null ? props.value : defaultValue,
                ),
            });
        },
        mount(node: HTMLInputElement, props: IDuplexProps, state) {
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
            const isActive = node === node.ownerDocument.activeElement;
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
            const value = props.value;
            return ((node as any)._wrapperState = {
                initialValue: value != null ? value : props.defaultValue,
                wasMultiple: !!props.multiple,
            });
        },
        mount(node: HTMLSelectElement, props: IDuplexProps) {
            const multiple = (node.multiple = !!props.multiple);
            const value = props.value;
            if (value != null) {
                updateOptions(node, multiple, value, false);
            } else if (props.defaultValue != null) {
                updateOptions(node, multiple, props.defaultValue, true);
            }
        },
        update(node: HTMLSelectElement, props: IDuplexProps) {
            // mount后这个属性没用
            delete (node as any)._wrapperState.initialValue;
            const state = (node as any)._wrapperState;

            const wasMultiple = state.wasMultiple;
            const multiple = (state.wasMultiple = !!props.multiple);
            const value = props.value;
            if (value != null) {
                updateOptions(node, multiple, value, false);
            } else if (wasMultiple !== multiple) {
                // 切换multiple后，需要重新计算
                if (props.defaultValue != null) {
                    updateOptions(node, multiple, props.defaultValue, true);
                } else {
                    // Revert the select back to its default unselected state.
                    updateOptions(node, multiple, multiple ? [] : "", false);
                }
            }
        },
    },
};
