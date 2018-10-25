import { createElement } from "../create-element";
import { Children } from "../children";

import { Component } from "../component";

const h = createElement;

const WrapComponent = class extends Component<any, any> {
    public render(): any {
        return (
            h("div", null,
                Children.only(this.props.children),
            )
        );
    }
};

describe("onlyChild", () => {
    it("should fail when passed two children", () => {
        expect(() => {
            const instance = (
                h(WrapComponent, null,
                    h("div"),
                    h("span"),
                )
            );
            Children.only(instance.props.children);
        }).toThrow();
    });
    it("should fail when passed nully values", () => {
        expect(() => {
            const instance = h(WrapComponent, null, null);
            Children.only(instance.props.children);
        }).toThrow();

        expect(() => {
            const instance = h(WrapComponent, null, undefined);
            Children.only(instance.props.children);
        }).toThrow();
    });

    it("should fail when key/value objects", () => {
        expect(() => {
            const instance = h(WrapComponent, null, [h("span", {key: "abc"})]);
            Children.only(instance.props.children);
        }).toThrow();
    });

    it("should not fail when passed interpolated single child", () => {
        expect(() => {
            const instance = h(WrapComponent, null, h("span"));
            Children.only(instance.props.children);
        }).not.toThrow();
    });

    it("should return the only child", () => {
        const instance = (
            h(WrapComponent, null,
                h("span"),
            )
        );
        expect(Children.only(instance.props.children)).toEqual(h("span"));
    });
});
