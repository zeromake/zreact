"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var zreact_1 = require("zreact");
var DummyComponent = /** @class */ (function (_super) {
    __extends(DummyComponent, _super);
    function DummyComponent(props, c) {
        var _this = _super.call(this, props, c) || this;
        _this.state = {
            input: "x" + _this.props + "x"
        };
        return _this;
    }
    DummyComponent.prototype.render = function (_a, _b, c, h) {
        var initialInput = _a.initialInput;
        var input = _b.input;
        return h(DummerComponent, { initialInput: initialInput, input: input });
    };
    return DummyComponent;
}(zreact_1.Component));
function DummerComponent(_a, c, h) {
    var input = _a.input, initialInput = _a.initialInput;
    return h("div", null,
        "Input: ",
        input,
        ", initial: ",
        initialInput);
}
zreact_1.render(zreact_1.h(DummerComponent, { initialInput: "The input" }), document.getElementById("xxx"));
