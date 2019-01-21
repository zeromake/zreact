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
        const ref = createRef();

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
                const Temp2 = BaseComponent as any;
                return <Temp2 ref={ref}/>;
            }
        }
        const Temp = ComponentInFooBarContext as any;
        ReactTestUtils.renderIntoDocument(<Temp />);
        const fiber: IFiber = (ref.current! as any).$reactInternalFiber;
        // console.log(fiber.child!.stateNode!.context);
        // expect(fiber.child!.stateNode!.context).toEqual({ foo: "abc", bar: 123 });
    });
});
