import { createElement } from "zreact-core/create-element";

import { Component } from "zreact-core/component";
import { createRef } from "zreact-core/create-ref";
import ReactTestUtils from "zreact-test-utils/index";
import * as PropTypes from "prop-types";
import { IFiber } from "zreact-fiber/type-shared";

describe("ReactContextValidator", () => {
    it("should filter out context not in contextTypes", () => {
        class BaseComponent extends Component<any, any> {
            public static contextTypes = {
                foo: PropTypes.string,
            };
            public render() {
                return <div />;
            }
        }
        const ref = createRef<BaseComponent>();

        class ComponentInFooBarContext extends Component<any, any> {
            public static childContextTypes = {
                foo: PropTypes.string,
                bar: PropTypes.number,
            };
            public getChildContext() {
                return {
                    foo: "abc",
                    bar: 123,
                };
            }

            public render() {
                return <BaseComponent ref={ref}/>;
            }
        }
        ReactTestUtils.renderIntoDocument(<ComponentInFooBarContext />);
        // console.log(fiber.child!.stateNode!.context);
        expect(ref.current!.context).toEqual({ foo: "abc" });
    });
});
