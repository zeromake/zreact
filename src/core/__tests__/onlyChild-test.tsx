import { createElement } from "zreact-core/create-element";
import { Children } from "zreact-core/children";

import { Component } from "zreact-core/component";

const h = createElement;

const WrapComponent = class extends Component<any, any> {
    public render(): any {
        return (
            <div>
                {Children.only(this.props.children)}
            </div>
        );
    }
};

describe("onlyChild", () => {
    it("should fail when passed two children", () => {
        expect(() => {
            const instance = (
                <WrapComponent>
                    {
                        [
                            <div/>,
                            <span/>,
                        ]
                    }
                </WrapComponent>
            );
            Children.only(instance.props.children);
        }).toThrow();
    });
    it("should fail when passed nully values", () => {
        expect(() => {
            const instance = <WrapComponent>
                {null}
            </WrapComponent>;
            Children.only(instance.props.children);
        }).toThrow();

        expect(() => {
            const instance = <WrapComponent>
                {undefined}
            </WrapComponent>;
            Children.only(instance.props.children);
        }).toThrow();
    });

    it("should fail when key/value objects", () => {
        expect(() => {
            const instance = <WrapComponent>
                {[<span key="abc"/>]}
            </WrapComponent>;
            Children.only(instance.props.children);
        }).toThrow();
    });

    it("should not fail when passed interpolated single child", () => {
        expect(() => {
            const instance = <WrapComponent>
                <span/>
            </WrapComponent>;
            Children.only(instance.props.children);
        }).not.toThrow();
    });

    it("should return the only child", () => {
        const instance = (
            <WrapComponent>
                <span/>
            </WrapComponent>
        );
        expect(Children.only(instance.props.children)).toEqual(<span/>);
    });
});
