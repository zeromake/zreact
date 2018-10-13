import { createElement, cloneElement } from "../create-element";
import { Children } from "../children";
import { Component } from "../component";
import { VirtualNode, IVNode } from "../type-shared";

describe("Children", () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it("should support identity for simple", () => {
        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: any, kid, index) {
            expect(this).toBe(context);
            expect(index).toBe(0);
            return kid;
        });

        const simpleKid = createElement("span", { key: "simple" });

        // First pass children into a component to fully simulate what happens when
        // using structures that arrive from transforms.

        const instance = createElement("div", null, simpleKid);
        Children.forEach(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        callback.calls.reset();
        const mappedChildren: VirtualNode[] = Children.map(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        expect(mappedChildren[0]).toEqual(createElement("span", { key: ".$simple" }));
    });

    it("should treat single arrayless child as being in array", () => {
        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            expect(index).toBe(0);
            return kid;
        });

        const simpleKid = createElement("span");
        const instance = createElement("div", null, simpleKid);
        Children.forEach(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        callback.calls.reset();
        const mappedChildren = Children.map(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        expect(mappedChildren[0]).toEqual(createElement("span", { key: ".0" }));
    });

    it("should treat single child in array as expected", () => {
        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        const simpleKid = createElement("span", { key: "simple" });
        const instance = createElement("div", null, [simpleKid]);
        Children.forEach(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        callback.calls.reset();
        const mappedChildren = Children.map(instance.props.children, callback, context);
        expect(callback).toHaveBeenCalledWith(simpleKid, 0);
        expect(mappedChildren[0]).toEqual(createElement("span", { key: ".$simple" }));
    });

    it("should be called for each child", () => {
        const zero = <div key="keyZero" />;
        const one = null;
        const two = createElement("div", { key: "keyTwo" });
        const three = null;
        const four = createElement("div", { key: "keyFour" });
        const context = {};

        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = (
            createElement("div", null,
                zero,
                one,
                two,
                three,
                four,
            )
        );

        function assertCalls() {
            expect(callback).toHaveBeenCalledWith(zero, 0);
            expect(callback).toHaveBeenCalledWith(one, 1);
            expect(callback).toHaveBeenCalledWith(two, 2);
            expect(callback).toHaveBeenCalledWith(three, 3);
            expect(callback).toHaveBeenCalledWith(four, 4);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual([
            createElement("div", { key: ".$keyZero" }),
            createElement("div", { key: ".$keyTwo" }),
            createElement("div", { key: ".$keyFour" }),
        ]);
    });

    it("React.Children.forEach不处理null void 0", () => {
        let i = 0;
        Children.forEach(null, function _() {
            i++;
        });
        Children.forEach(void 0, function _() {
            i++;
        });
        expect(i).toBe(0);
    });

    it("should traverse children of different kinds", () => {
        const div = <div key="divNode" />;
        const span = <span key="spanNode" />;
        const a = <a key="aNode" />;

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });
        const instance = (
            <div>
                {div}
                {[[span]]}
                {[a]}
                {"string"}
                {1234}
                {true}
                {false}
                {null}
                {undefined}
            </div>
        );

        function assertCalls() {
            expect(callback.calls.count()).toBe(9);
            expect(callback).toHaveBeenCalledWith(div, 0);
            expect(callback).toHaveBeenCalledWith(span, 1);
            expect(callback).toHaveBeenCalledWith(a, 2);
            expect(callback).toHaveBeenCalledWith("string", 3);
            expect(callback).toHaveBeenCalledWith(1234, 4);
            expect(callback).toHaveBeenCalledWith(null, 5);
            expect(callback).toHaveBeenCalledWith(null, 6);
            expect(callback).toHaveBeenCalledWith(null, 7);
            expect(callback).toHaveBeenCalledWith(null, 8);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".$divNode" />,
            <span key=".1:0:$spanNode" />,
            <a key=".2:$aNode" />,
            "string",
            1234,
        ]);
    });

    it("should be called for each child in nested structure", () => {
        const zero = <div key="keyZero" />;
        const one = null;
        const two = <div key="keyTwo" />;
        const three = null;
        const four = <div key="keyFour" />;
        const five = <div key="keyFive" />;

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = <div>{[[zero, one, two], [three, four], five]}</div>;

        function assertCalls() {
            expect(callback.calls.count()).toBe(6);
            expect(callback).toHaveBeenCalledWith(zero, 0);
            expect(callback).toHaveBeenCalledWith(one, 1);
            expect(callback).toHaveBeenCalledWith(two, 2);
            expect(callback).toHaveBeenCalledWith(three, 3);
            expect(callback).toHaveBeenCalledWith(four, 4);
            expect(callback).toHaveBeenCalledWith(five, 5);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".0:$keyZero" />,
            <div key=".0:$keyTwo" />,
            <div key=".1:$keyFour" />,
            <div key=".$keyFive" />,
        ]);
    });

    it("should retain key across two mappings", () => {
        const zeroForceKey = <div key="keyZero" />;
        const oneForceKey = <div key="keyOne" />;
        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });
        const forcedKeys = (
            <div>
                {zeroForceKey}
                {oneForceKey}
            </div>
        );

        function assertCalls() {
            expect(callback).toHaveBeenCalledWith(zeroForceKey, 0);
            expect(callback).toHaveBeenCalledWith(oneForceKey, 1);
            callback.calls.reset();
        }

        Children.forEach(forcedKeys.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(forcedKeys.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual([<div key=".$keyZero" />, <div key=".$keyOne" />]);
    });

    it("should be called for each child in an iterable without keys", () => {
        // spyOn(console, "error");
        const threeDivIterable = {
            ["@@iterator"]() {
                let i = 0;
                return {
                    next() {
                        if (i++ < 3) {
                            return { value: <div />, done: false };
                        } else {
                            return { value: undefined, done: true };
                        }
                    },
                };
            },
        } as any;

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = <div>{threeDivIterable}</div>;

        function assertCalls() {
            expect(callback.calls.count()).toBe(3);
            expect(callback).toHaveBeenCalledWith(<div />, 0);
            expect(callback).toHaveBeenCalledWith(<div />, 1);
            expect(callback).toHaveBeenCalledWith(<div />, 2);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        const compareChildren = [<div key=".0" />, <div key=".1" />, <div key=".2" />];
        expect(mappedChildren).toEqual(compareChildren);
    });

    it("should be called for each child in an iterable with keys", () => {
        const threeDivIterable: any = {
            ["@@iterator"]() {
                let i = 0;
                return {
                    next() {
                        if (i++ < 3) {
                            return { value: <div key={"#" + i} />, done: false };
                        } else {
                            return { value: undefined, done: true };
                        }
                    },
                };
            },
        };

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = <div>{threeDivIterable}</div>;

        function assertCalls() {
            expect(callback.calls.count()).toBe(3);
            expect(callback).toHaveBeenCalledWith(<div key="#1" />, 0);
            expect(callback).toHaveBeenCalledWith(<div key="#2" />, 1);
            expect(callback).toHaveBeenCalledWith(<div key="#3" />, 2);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual([<div key=".$#1" />, <div key=".$#2" />, <div key=".$#3" />]);
    });

    it("should not enumerate enumerable numbers (#4776)", () => {
        /*eslint-disable no-extend-native */
        (Number.prototype as any)["@@iterator"] = function _() {
            throw new Error("number iterator called");
        };
        /*eslint-enable no-extend-native */

        try {
            const instance = (
                <div>
                    {5}
                    {12}
                    {13}
                </div>
            );

            const context = {};
            const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
                expect(this).toBe(context);
                return kid;
            });

            const assertCalls = function _() {
                expect(callback.calls.count()).toBe(3);
                expect(callback).toHaveBeenCalledWith(5, 0);
                expect(callback).toHaveBeenCalledWith(12, 1);
                expect(callback).toHaveBeenCalledWith(13, 2);
                callback.calls.reset();
            };

            Children.forEach(instance.props.children, callback, context);
            assertCalls();

            const mappedChildren = Children.map(instance.props.children, callback, context);
            assertCalls();
            expect(mappedChildren).toEqual([5, 12, 13]);
        } finally {
            delete (Number.prototype as any)["@@iterator"];
        }
    });

    it("should allow extension of native prototypes", () => {
        /*eslint-disable no-extend-native */
        (String.prototype as any).key = "react";
        (Number.prototype as any).key = "rocks";
        /*eslint-enable no-extend-native */

        const instance = (
            <div>
                {"a"}
                {13}
            </div>
        );

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid, index) {
            expect(this).toBe(context);
            return kid;
        });

        function assertCalls() {
            (expect(callback.calls.count()).toBe as any)(2, 0);
            expect(callback).toHaveBeenCalledWith("a", 0);
            expect(callback).toHaveBeenCalledWith(13, 1);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(instance.props.children, callback, context);
        assertCalls();
        expect(mappedChildren).toEqual(["a", 13]);

        delete (String.prototype as any).key;
        delete (Number.prototype as any).key;
    });

    it("should pass key to returned component", () => {
        const mapFn = function _(kid: any, index: number): IVNode {
            return <div>{kid}</div>;
        };

        const simpleKid = <span key="simple" />;

        const instance = <div>{simpleKid}</div>;
        const mappedChildren = Children.map(instance.props.children, mapFn) as IVNode[];

        expect(Children.count(mappedChildren)).toBe(1);
        expect(mappedChildren[0]).not.toBe(simpleKid);
        expect(mappedChildren[0].props.children).toBe(simpleKid);
        expect(mappedChildren[0].key).toBe(".$simple");
    });

    it("should invoke callback with the right context", () => {
        let lastContext;
        const callback = function _(this: object, kid: any, index: number): any {
            lastContext = this;
            return this;
        };

        // TODO: Use an object to test, after non-object fragments has fully landed.
        const scopeTester = "scope tester";

        const simpleKid = <span key="simple" />;
        const instance = <div>{simpleKid}</div>;
        Children.forEach(instance.props.children, callback, scopeTester as any);
        expect(lastContext).toBe(scopeTester);

        const mappedChildren = Children.map(instance.props.children, callback, scopeTester as any);

        expect(Children.count(mappedChildren)).toBe(1);
        expect(mappedChildren[0]).toBe(scopeTester);
    });

    it("should be called for each child", () => {
        const zero = <div key="keyZero" />;
        const one = null;
        const two = <div key="keyTwo" />;
        const three = null;
        const four = <div key="keyFour" />;
        const context = {};

        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = (
            <div>
                {zero}
                {one}
                {two}
                {three}
                {four}
            </div>
        );

        function assertCalls() {
            expect(callback).toHaveBeenCalledWith(zero, 0);
            expect(callback).toHaveBeenCalledWith(one, 1);
            expect(callback).toHaveBeenCalledWith(two, 2);
            expect(callback).toHaveBeenCalledWith(three, 3);
            expect(callback).toHaveBeenCalledWith(four, 4);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(
            instance.props.children,
            callback,
            context,
        );
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".$keyZero" />,
            <div key=".$keyTwo" />,
            <div key=".$keyFour" />,
        ]);
    });

    it("should traverse children of different kinds", () => {
        const div = <div key="divNode" />;
        const span = <span key="spanNode" />;
        const a = <a key="aNode" />;

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid) {
            expect(this).toBe(context);
            return kid;
        });

        const instance = (
            <div>
                {div}
                {[[span]]}
                {[a]}
                {"string"}
                {1234}
                {true}
                {false}
                {null}
                {undefined}
            </div>
        );

        function assertCalls() {
            expect(callback.calls.count()).toBe(9);
            expect(callback).toHaveBeenCalledWith(div, 0);
            expect(callback).toHaveBeenCalledWith(span, 1);
            expect(callback).toHaveBeenCalledWith(a, 2);
            expect(callback).toHaveBeenCalledWith("string", 3);
            expect(callback).toHaveBeenCalledWith(1234, 4);
            expect(callback).toHaveBeenCalledWith(null, 5);
            expect(callback).toHaveBeenCalledWith(null, 6);
            expect(callback).toHaveBeenCalledWith(null, 7);
            expect(callback).toHaveBeenCalledWith(null, 8);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(
            instance.props.children,
            callback,
            context,
        );
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".$divNode" />,
            <span key=".1:0:$spanNode" />,
            <a key=".2:$aNode" />,
            "string",
            1234,
        ]);
    });

    it("should be called for each child in nested structure", () => {
        const zero = <div key="keyZero" />;
        const one = null;
        const two = <div key="keyTwo" />;
        const three = null;
        const four = <div key="keyFour" />;
        const five = <div key="keyFive" />;

        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(kid) {
            return kid;
        });

        const instance = <div>{[[zero, one, two], [three, four], five]}</div>;

        function assertCalls() {
            expect(callback.calls.count()).toBe(6);
            expect(callback).toHaveBeenCalledWith(zero, 0);
            expect(callback).toHaveBeenCalledWith(one, 1);
            expect(callback).toHaveBeenCalledWith(two, 2);
            expect(callback).toHaveBeenCalledWith(three, 3);
            expect(callback).toHaveBeenCalledWith(four, 4);
            expect(callback).toHaveBeenCalledWith(five, 5);
            callback.calls.reset();
        }

        Children.forEach(instance.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(
            instance.props.children,
            callback,
            context,
        );
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".0:$keyZero" />,
            <div key=".0:$keyTwo" />,
            <div key=".1:$keyFour" />,
            <div key=".$keyFive" />,
        ]);
    });

    it("should retain key across two mappings", () => {
        const zeroForceKey = <div key="keyZero" />;
        const oneForceKey = <div key="keyOne" />;
        const context = {};
        const callback = jasmine.createSpy().and.callFake(function _(this: object, kid) {
            expect(this).toBe(context);
            return kid;
        });

        const forcedKeys = (
            <div>
                {zeroForceKey}
                {oneForceKey}
            </div>
        );

        function assertCalls() {
            expect(callback).toHaveBeenCalledWith(zeroForceKey, 0);
            expect(callback).toHaveBeenCalledWith(oneForceKey, 1);
            callback.calls.reset();
        }

        Children.forEach(forcedKeys.props.children, callback, context);
        assertCalls();

        const mappedChildren = Children.map(
            forcedKeys.props.children,
            callback,
            context,
        );
        assertCalls();
        expect(mappedChildren).toEqual([
            <div key=".$keyZero" />,
            <div key=".$keyOne" />,
        ]);
    });

    it("should not throw if key provided is a dupe with array key", () => {
        const zero = <div />;
        const one = <div key="0" />;

        const mapFn = function _() {
            return null;
        };

        const instance = (
            <div>
                {zero}
                {one}
            </div>
        );

        expect(function __() {
            Children.map(instance.props.children, mapFn);
        }).not.toThrow();
    });

    it("should use the same key for a cloned element", () => {
        const instance = (
            <div>
                <div />
            </div>
        );

        const mapped = Children.map(
            instance.props.children,
            (element) => element,
        ) as IVNode[];

        const mappedWithClone = Children.map(
            instance.props.children,
            (element: any) => cloneElement(element),
        ) as IVNode[];

        expect(mapped[0].key).toBe(mappedWithClone[0].key);
    });

    it("should use the same key for a cloned element with key", () => {
        const instance = (
            <div>
                <div key="unique" />
            </div>
        );

        const mapped = Children.map(
            instance.props.children,
            (element: any) => element,
        ) as IVNode[];

        const mappedWithClone = Children.map(
            instance.props.children,
            (element: any) => cloneElement(element, { key: "unique" }),
        ) as IVNode[];

        expect(mapped[0].key).toBe(mappedWithClone[0].key);
    });

    it("should return 0 for null children", () => {
        const numberOfChildren = Children.count(null);
        expect(numberOfChildren).toBe(0);
    });

    it("should return 0 for undefined children", () => {
        const numberOfChildren = Children.count(undefined);
        expect(numberOfChildren).toBe(0);
    });

    it("should return 1 for single child", () => {
        const simpleKid = <span key="simple" />;
        const instance = <div>{simpleKid}</div>;
        const numberOfChildren = Children.count(instance.props.children);
        expect(numberOfChildren).toBe(1);
    });

    it("should count the number of children in flat structure", () => {
        const zero = <div key="keyZero" />;
        const one = null;
        const two = <div key="keyTwo" />;
        const three = null;
        const four = <div key="keyFour" />;

        const instance = (
            <div>
                {zero}
                {one}
                {two}
                {three}
                {four}
            </div>
        );
        const numberOfChildren = Children.count(instance.props.children);
        expect(numberOfChildren).toBe(5);
    });

    it("should count the number of children in nested structure", () => {
        const zero = <div key="keyZero"/>;
        const one = null;
        const two = <div key="keyTwo"/>;
        const three = null;
        const four = <div key="keyFour"/>;
        const five = <div key="keyFive"/>;

        const instance = (
            <div>{[
                [
                    [
                        zero,
                        one,
                        two,
                    ],
                    [
                        three,
                        four,
                    ],
                    five,
                ],
                null,
            ]}</div>
        );
        const numberOfChildren = Children.count(instance.props.children);
        expect(numberOfChildren).toBe(7);
    });

    it("should flatten children to an array", () => {
        expect(Children.toArray(undefined)).toEqual([]);
        expect(Children.toArray(null)).toEqual([]);

        expect(Children.toArray(<div />).length).toBe(1);
        expect(Children.toArray([<div />]).length).toBe(1);
        expect((Children.toArray(<div />)[0] as IVNode).key).toBe(
            (Children.toArray([<div />])[0] as IVNode).key,
        );

        const flattened = Children.toArray([
            [<div key="apple" />, <div key="banana" />, <div key="camel" />],
            [<div key="banana" />, <div key="camel" />, <div key="deli" />],
        ]) as IVNode[];
        expect(flattened.length).toBe(6);
        expect(flattened[1].key).toContain("banana");
        expect(flattened[3].key).toContain("banana");
        expect(flattened[1].key).not.toBe(flattened[3].key);

        const reversed = Children.toArray([
            [<div key="camel" />, <div key="banana" />, <div key="apple" />],
            [<div key="deli" />, <div key="camel" />, <div key="banana" />],
        ]) as IVNode[];
        expect(flattened[0].key).toBe(reversed[2].key);
        expect(flattened[1].key).toBe(reversed[1].key);
        expect(flattened[2].key).toBe(reversed[0].key);
        expect(flattened[3].key).toBe(reversed[5].key);
        expect(flattened[4].key).toBe(reversed[4].key);
        expect(flattened[5].key).toBe(reversed[3].key);

        // null/undefined/bool are all omitted
        expect(Children.toArray([1, "two", null, undefined, true])).toEqual([
            1,
            "two",
        ]);
    });

    it("should escape keys", () => {
        const zero = <div key="1" />;
        const one = <div key="1=::=2" />;
        const instance = (
            <div>
                {zero}
                {one}
            </div>
        );
        const mappedChildren = Children.map(
            instance.props.children,
            (kid: any) => kid,
        ) as IVNode[];
        expect(mappedChildren).toEqual([
            <div key=".$1" />,
            <div key=".$1=0=2=2=02" />,
        ]);
    });

    it("should throw on object", () => {
        // 'Objects are not valid as a React child (found: object with keys ' +
        // '{a, b}). If you meant to render a collection of children, use an ' +
        // 'array instead.',
        expect(function _() {
            Children.forEach({ a: 1, b: 2 } as any, function __() { }, null);
        }).toThrow("children: type is invalid.");
    });

    it("should throw on regex", () => {
        // Really, we care about dates (#4840) but those have nondeterministic
        // serialization (timezones) so let's test a regex instead:
        expect(function _() {
            Children.forEach(/abc/ as any, function __() { }, null);
        }).toThrow("children: type is invalid.");
    });

    it("should map return array", () => {
        const children = [
            "**粗体**",
            "~~删除线~~",
        ];
        const child = Children.map(children, (item: any, index: number) => {
            return [
                <div key={index}>{item}</div>,
            ];
        });
        expect(child).toEqual([
            <div key=".0/.$0">**粗体**</div>,
            <div key=".1/.$1">~~删除线~~</div>,
        ]);
    });

    // it("复杂的孩子转换", () => {
    //     function getString(nodes) {
    //         const str = [];
    //         for (let i = 0, node; (node = nodes[i++]);) {
    //             if (node.nodeType === 8 && node.nodeValue.indexOf("react-text") !== 0) {
    //                 continue;
    //             }
    //             str.push(node.nodeName.toLowerCase());
    //         }
    //         return str.join(" ");
    //     }
    //     let index = 0;
    //     const map = [
    //         <div>
    //             1111<p>ddd</p>
    //             <span>333</span>
    //             <Link />
    //         </div>,
    //         <div>
    //             <em>新的</em>
    //             <span>111</span>222<span>333</span>
    //             <b>444</b>
    //             <Link />
    //         </div>,
    //         <div>
    //             <span>33</span>
    //         </div>,
    //     ];
    //     function Link() {
    //         return index === 1 ? <strong>ddd</strong> : <i>ddd</i>;
    //     }
    //     class App extends Component<any, any> {
    //         constructor(props: any) {
    //             super(props);
    //             this.state = {
    //                 aaa: "aaa",
    //             };
    //         }
    //         public componentDidMount() {
    //         }
    //         public componentWillUpdate() {
    //         }
    //         public render() {
    //             return map[index++];
    //         }
    //         private change(a: string) {
    //             this.setState({
    //                 aaa: a,
    //             });
    //         }
    //     }
    //     const div = document.createElement("div");
    //     const s = render(<App />, div);

    //     expect(getString(div.firstChild.childNodes)).toBe("#text p span strong");
    //     s.change(100);
    //     expect(getString(div.firstChild.childNodes)).toBe("em span #text span b i");
    //     s.change(100);
    //     expect(getString(div.firstChild.childNodes)).toBe("span");
    // });
    // it("对一个容器节点反复渲染组件或元素 ", () => {
    //     class Comp extends Component<any, any> {
    //         public render() {
    //             return <span>span in a component</span>;
    //         }
    //     }
    //     const div = document.createElement("div");
    //     function test(content) {
    //         render(content, div);
    //     }

    //     test(<Comp />);
    //     test(<div>just a div</div>);
    //     test(<Comp />);

    //     expect((div.firstChild as Element).innerHTML).toEqual("span in a component");
    // });
});
