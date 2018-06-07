function check(): any {
    return check;
}
(check as any).isRequired = check;
export default {
    array: check,
    bool: check,
    func: check,
    number: check,
    object: check,
    string: check,
    symbol: check,

    any: check,
    arrayOf: check,
    element: check,
    instanceOf: check,
    node: check,
    objectOf: check,
    oneOf: check,
    oneOfType: check,
    shape: check,
    exact: check,
};
