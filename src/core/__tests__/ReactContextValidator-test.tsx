import { createElement } from "zreact-core/create-element";

import { Component } from "zreact-core/component";
import { createRef } from "zreact-core/create-ref";
import { createContext } from "zreact-core/create-context";
import ReactTestUtils from "zreact-test-utils/index";
import { render } from "zreact-render/dom/index";
import * as PropTypes from "prop-types";

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
        expect(ref.current!.context).toEqual({ foo: "abc" });
    });
    it("should pass next context to lifecycles", () => {
        let actualComponentWillReceiveProps;
        let actualShouldComponentUpdate;
        let actualComponentWillUpdate;
        class Parent extends Component<any, any> {
            public static childContextTypes = {
                foo: PropTypes.string.isRequired,
                bar: PropTypes.string.isRequired,
            };
            public getChildContext() {
                return {
                    foo: this.props.foo,
                    bar: "bar",
                };
            }

            public render() {
                return <BaseComponent/>;
            }
        }
        class BaseComponent extends Component<any, any> {
            public static contextTypes = {
                foo: PropTypes.string,
            };
            public UNSAFE_componentWillReceiveProps(nextProps: any, nextContext: any) {
                actualComponentWillReceiveProps = nextContext;
                return true;
            }

            public shouldComponentUpdate(nextProps: any, nextState: any, nextContext: any) {
                actualShouldComponentUpdate = nextContext;
                return true;
            }

            public UNSAFE_componentWillUpdate(nextProps: any, nextState: any, nextContext: any) {
                actualComponentWillUpdate = nextContext;
            }

            public render() {
                return <div />;
            }
        }
        const container = document.createElement("div");
        render(<Parent foo="abc" />, container);
        render(<Parent foo="def" />, container);
        expect(actualComponentWillReceiveProps).toEqual({ foo: "def" });
        expect(actualShouldComponentUpdate).toEqual({ foo: "def" });
        expect(actualComponentWillUpdate).toEqual({ foo: "def" });
    });
    it("React.createContext 通过 Provider 传入数据", () => {
        const container = document.createElement("div");
        const ThemeContext = createContext("light");
        class CreateContext extends Component<any, any> {
            public render() {
                return (
                    <ThemeContext.Provider value="dark">
                        <Toolbar/>
                    </ThemeContext.Provider>
                );
            }
        }
        function Toolbar(props: any) {
            return (
                <div class="toolbar">
                    <ThemedButton/>
                </div>
            );
        }
        let theme = "light";
        function ThemedButton(props: any) {
            return <ThemeContext.Consumer>{
                (ptheme: any) => <Button {...props} theme={ptheme} />
            }</ThemeContext.Consumer>;
        }
        function Button(props: any) {
            theme = props.theme;
            return (
                <div>
                    正确值应该是传入的dark，现在传入值为：
                    <span style={{ color: "red" }}>{ props.theme }</span>
                </div>
            );
        }
        render(<CreateContext/>, container);
        expect(theme).toBe("dark");
    });
    it("should check context types", () => {
        class Div extends Component<any, any> {
            public static contextTypes = {
                foo: PropTypes.string.isRequired,
            };
            public render() {
                return <div />;
            }
        }
        (expect(() => ReactTestUtils.renderIntoDocument(<Div />)) as any).toWarnDev(
            "Warning: Failed context type: " +
            "The context `foo` is marked as required in `Component`, but its value " +
            "is `undefined`.\n' + '    in Component (at **)",
        );
        class ComponentInFooStringContext extends Component<any, any> {
            public static childContextTypes = {
                foo: PropTypes.string,
            };
            public getChildContext() {
                return {
                    foo: this.props.fooValue,
                };
            }

            public render() {
                return <Div/>;
            }
        }
        ReactTestUtils.renderIntoDocument(<ComponentInFooStringContext fooValue="bar" />);
        class ComponentInFooNumberContext extends Component<any, any> {
            public static childContextTypes = {
                foo: PropTypes.number,
            };
            public getChildContext() {
                return {
                    foo: this.props.fooValue,
                };
            }
            public render() {
                return <Div/>;
            }
        }
        (expect(() => ReactTestUtils.renderIntoDocument(<ComponentInFooNumberContext fooValue={123} />)) as any).toWarnDev(
            "Warning: Failed context type: " +
            "Invalid context `foo` of type `number` supplied " +
            "to `Component`, expected `string`.\n" +
            "    in Component (at **)\n" +
            "    in ComponentInFooNumberContext (at **)",
        );
    });
    it("should check child context types", () => {
        class BaseComponent extends Component<any, any> {
            public static childContextTypes = {
            foo: PropTypes.string.isRequired,
            bar: PropTypes.number,
        };
            public getChildContext() {
                return this.props.testContext;
            }

            public render() {
                return <div />;
            }
        }

        (expect(() => ReactTestUtils.renderIntoDocument(<BaseComponent testContext={{ bar: 123 }} />)) as any).toWarnDev(
            "Warning: Failed child context type: " +
            "The child context `foo` is marked as required in `Component`, but its " +
            "value is `undefined`.\n" +
            "    in Component (at **)",
        );

        (expect(() => ReactTestUtils.renderIntoDocument(<BaseComponent testContext={{ foo: 123 }} />)) as any).toWarnDev(
            "Warning: Failed child context type: " +
            "Invalid child context `foo` of type `number` " +
            "supplied to `Component`, expected `string`.\n" +
            "    in Component (at **)",
        );

        // No additional errors expected
        ReactTestUtils.renderIntoDocument(<BaseComponent testContext={{ foo: "foo", bar: 123 }} />);

        ReactTestUtils.renderIntoDocument(<BaseComponent testContext={{ foo: "foo" }} />);
    });
});
