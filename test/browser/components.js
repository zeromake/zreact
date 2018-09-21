import { h, cloneElement, render, rerender, Component, Children } from 'zreact';
/** @jsx h */

let spyAll = obj => Object.keys(obj).forEach( key => obj[key] = sinon.spy(obj,key) );

function getAttributes(node) {
	let attrs = {};
	if (node.attributes) {
		for (let i=node.attributes.length; i--; ) {
			attrs[node.attributes[i].name] = node.attributes[i].value;
		}
	}
	return attrs;
}

// hacky normalization of attribute order across browsers.
function sortAttributes(html) {
	return html.replace(/<([a-z0-9-]+)((?:\s[a-z0-9:_.-]+=".*?")+)((?:\s*\/)?>)/gi, (s, pre, attrs, after) => {
		let list = attrs.match(/\s[a-z0-9:_.-]+=".*?"/gi).sort( (a, b) => a>b ? 1 : -1 );
		if (~after.indexOf('/')) after = '></'+pre+'>';
		return '<' + pre + list.join('') + after;
	});
}

const Empty = () => null;

describe('Components', () => {
	let scratch;

	before( () => {
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);
	});

	beforeEach( () => {
		let c = scratch.firstElementChild;
		if (c) render(<Empty />, scratch, c);
		scratch.innerHTML = '';
	});

	after( () => {
		scratch.parentNode.removeChild(scratch);
		scratch = null;
	});

	it('should render components', () => {
		class C1 extends Component {
			render() {
				return <div>C1</div>;
			}
		}
		sinon.spy(C1.prototype, 'render');
		render(<C1 />, scratch);

		expect(C1.prototype.render)
			.to.have.been.calledOnce
			.and.to.have.been.calledWithMatch({}, {})
			.and.to.have.returned(sinon.match({ type:'div' }));

		expect(scratch.innerHTML).to.equal('<div>C1</div>');
	});


	it('should render functional components', () => {
		const PROPS = { foo:'bar', onBaz:()=>{}, children: null};

        const C3 = sinon.spy( props => <div {...props} /> );

		render(<C3 {...PROPS} />, scratch);

		expect(C3)
			.to.have.been.calledOnce
			.and.to.have.been.calledWithMatch(PROPS)
			.and.to.have.returned(sinon.match({
				type: 'div',
				props: PROPS
			}));

		expect(scratch.innerHTML).to.equal('<div foo="bar"></div>');
	});


	it('should render components with props', () => {
		const PROPS = { foo:'bar', onBaz:()=>{}, children: null };
		let constructorProps;

		class C2 extends Component {
			constructor(props) {
				super(props);
				constructorProps = props;
			}
			render(props) {
				return <div {...props} />;
			}
		}
		sinon.spy(C2.prototype, 'render');

		render(<C2 {...PROPS} />, scratch);
		expect(constructorProps).to.deep.equal(PROPS);

		expect(C2.prototype.render)
			.to.have.been.calledOnce
			.and.to.have.been.calledWithMatch(PROPS, {})
			.and.to.have.returned(sinon.match({
				type: 'div',
				props: PROPS
			}));

		expect(scratch.innerHTML).to.equal('<div foo="bar"></div>');
	});


	it('should clone components', () => {
		function Comp () {}
		let instance = <Comp/>;
		let clone = cloneElement(instance);
		expect(clone.prototype).to.equal(instance.prototype);
	});


	// Test for Issue #73
	it('should remove orphaned elements replaced by Components', () => {
		class Comp extends Component {
			render() {
				return <span>span in a component</span>;
			}
		}

		let root;
		function test(content) {
			root = render(content, scratch, root);
		}

		test(<Comp />);
		test(<div>just a div</div>);
		test(<Comp />);

		expect(scratch.innerHTML).to.equal('<span>span in a component</span>');
	});


	// Test for Issue #176
	it('should remove children when root changes to text node', () => {
		let comp;

		class Comp extends Component {
			render(_, { alt }) {
				return alt ? 'asdf' : <div>test</div>;
			}
		}

        render(<Comp ref={c=>comp=c} />, scratch);

		comp.setState({ alt:true });
		comp.forceUpdate();
		expect(scratch.innerHTML, 'switching to textnode').to.equal('asdf');

		comp.setState({ alt:false });
		comp.forceUpdate();
		expect(scratch.innerHTML, 'switching to element').to.equal('<div>test</div>');

		comp.setState({ alt:true });
		comp.forceUpdate();
		expect(scratch.innerHTML, 'switching to textnode 2').to.equal('asdf');
	});

		// Test for Issue #254
	it('should not recycle common class children with different keys', () => {
		let idx = 0;
		let msgs = ['A','B','C','D','E','F','G','H'];
		let sideEffect = sinon.spy();

		class Comp extends Component {
			componentWillMount() {
				this.innerMsg = msgs[(idx++ % 8)];
				sideEffect();
			}
			render() {
				return <div>{this.innerMsg}</div>;
			}
		}
		sinon.spy(Comp.prototype, 'componentWillMount');

		class GoodContainer extends Component {

			constructor(props) {
				super(props);
				this.state.alt = false;
			}

			render(_, {alt}) {
				return (
					<div>
						{alt ? null : (<Comp key={1} alt={alt}/>)}
						{alt ? null : (<Comp key={2} alt={alt}/>)}
						{alt ? (<Comp key={3} alt={alt}/>) : null}
					</div>
				);
			}
		}

		class BadContainer extends Component {

			constructor(props) {
				super(props);
				this.state.alt = false;
			}

			render(_, {alt}) {
				return (
					<div>
						{alt ? null : (<Comp alt={alt}/>)}
						{alt ? null : (<Comp alt={alt}/>)}
						{alt ? (<Comp alt={alt}/>) : null}
					</div>
				);
			}
		}

		let good, bad;
		let root = render(<GoodContainer ref={c=>good=c} />, scratch);
		expect(scratch.textContent, 'new component with key present').to.equal('AB');
		expect(Comp.prototype.componentWillMount).to.have.been.calledTwice;
		expect(sideEffect).to.have.been.calledTwice;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		good.setState({alt: true});
		good.forceUpdate();
		expect(scratch.textContent, 'new component with key present re-rendered').to.equal('C');
		//we are recycling the first 2 components already rendered, just need a new one
		expect(Comp.prototype.componentWillMount).to.have.been.calledOnce;
		expect(sideEffect).to.have.been.calledOnce;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		render(<BadContainer ref={c=>bad=c} />, scratch, root);
		expect(scratch.textContent, 'new component without key').to.equal('DE');
		expect(Comp.prototype.componentWillMount).to.have.been.calledTwice;
		expect(sideEffect).to.have.been.calledTwice;

		sideEffect.resetHistory();
		Comp.prototype.componentWillMount.resetHistory();
		bad.setState({alt: true});
		bad.forceUpdate();
		expect(scratch.textContent, 'new component without key re-rendered').to.equal('D');
		expect(Comp.prototype.componentWillMount).to.not.have.been.called;
		expect(sideEffect).to.not.have.been.called;


	});



	describe('props.children', () => {
		it('should support passing children as a prop', () => {
			const Foo = props => <div {...props} />;

			render(<Foo a="b" children={[
				<span class="bar">bar</span>,
				'123',
				456
			]} />, scratch);

			expect(scratch.innerHTML).to.equal('<div a="b"><span class="bar">bar</span>123456</div>');
		});

		it('should be ignored when explicit children exist', () => {
			const Foo = props => <div {...props}>a</div>;

			render(<Foo children={'b'} />, scratch);

			expect(scratch.innerHTML).to.equal('<div>a</div>');
		});
	});


	describe('High-Order Components', () => {
		it('should render nested functional components', () => {
			const PROPS = { foo:'bar', onBaz:()=>{}, children: null };

			const Outer = sinon.spy(
				props => <Inner {...props} />
			);

			const Inner = sinon.spy(
				props => <div {...props}>inner</div>
			);

			render(<Outer {...PROPS} />, scratch);

			expect(Outer)
				.to.have.been.calledOnce
				.and.to.have.been.calledWithMatch(PROPS)
				.and.to.have.returned(sinon.match({
					type: Inner,
					props: PROPS
				}));

			expect(Inner)
				.to.have.been.calledOnce
				.and.to.have.been.calledWithMatch({...PROPS, children: 'inner'})
				.and.to.have.returned(sinon.match({
					type: 'div',
					props: {...PROPS, children: 'inner'},
				}));

			expect(scratch.innerHTML).to.equal('<div foo="bar">inner</div>');
		});

		it('should re-render nested functional components', () => {
			let doRender = null;
			class Outer extends Component {
				componentDidMount() {
					let i = 1;
					doRender = () => this.setState({ i: ++i });
				}
				componentWillUnmount() {}
				render(props, { i }) {
					return <Inner i={i} {...props} />;
				}
			}
			sinon.spy(Outer.prototype, 'render');
			sinon.spy(Outer.prototype, 'componentWillUnmount');

			let j = 0;
			const Inner = sinon.spy(
				props => <div j={ ++j } {...props}>inner</div>
			);

			render(<Outer foo="bar" />, scratch);

			// update & flush
			doRender();
			rerender();

			expect(Outer.prototype.componentWillUnmount)
				.not.to.have.been.called;

			expect(Inner).to.have.been.calledTwice;

			expect(Inner.secondCall)
				.to.have.been.calledWithMatch({ foo:'bar', i:2 })
				.and.to.have.returned(sinon.match({
					props: {
						j: 2,
						i: 2,
						foo: 'bar'
					}
				}));

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '2',
				i: '2',
				foo: 'bar'
			});

			// update & flush
			doRender();
			rerender();

			expect(Inner).to.have.been.calledThrice;

			expect(Inner.thirdCall)
				.to.have.been.calledWithMatch({ foo:'bar', i:3 })
				.and.to.have.returned(sinon.match({
					props: {
						j: 3,
						i: 3,
						foo: 'bar'
					}
				}));

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '3',
				i: '3',
				foo: 'bar'
			});
		});

		it('should re-render nested components', () => {
			let doRender = null,
				alt = false;

			class Outer extends Component {
				componentDidMount() {
					let i = 1;
					doRender = () => this.setState({ i: ++i });
				}
				componentWillUnmount() {}
				render(props, { i }) {
					if (alt) return <div is-alt />;
					return <Inner i={i} {...props} />;
				}
			}
			sinon.spy(Outer.prototype, 'render');
			sinon.spy(Outer.prototype, 'componentDidMount');
			sinon.spy(Outer.prototype, 'componentWillUnmount');

			let j = 0;
			class Inner extends Component {
				constructor(...args) {
					super();
					this._constructor(...args);
				}
				_constructor() {}
				componentWillMount() {}
				componentDidMount() {}
				componentWillUnmount() {}
				render(props) {
					return <div j={ ++j } {...props}>inner</div>;
				}
			}
			sinon.spy(Inner.prototype, '_constructor');
			sinon.spy(Inner.prototype, 'render');
			sinon.spy(Inner.prototype, 'componentWillMount');
			sinon.spy(Inner.prototype, 'componentDidMount');
			sinon.spy(Inner.prototype, 'componentWillUnmount');

			render(<Outer foo="bar" />, scratch);

			expect(Outer.prototype.componentDidMount).to.have.been.calledOnce;

			// update & flush
			doRender();
			rerender();

			expect(Outer.prototype.componentWillUnmount).not.to.have.been.called;

			expect(Inner.prototype._constructor).to.have.been.calledOnce;
			expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.render).to.have.been.calledTwice;

			expect(Inner.prototype.render.secondCall)
				.to.have.been.calledWithMatch({ foo:'bar', i:2 })
				.and.to.have.returned(sinon.match({
					props: {
						j: 2,
						i: 2,
						foo: 'bar'
					}
				}));

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '2',
				i: '2',
				foo: 'bar'
			});

			expect(sortAttributes(scratch.innerHTML)).to.equal(sortAttributes('<div foo="bar" j="2" i="2">inner</div>'));

			// update & flush
			doRender();
			rerender();

			expect(Inner.prototype.componentWillUnmount).not.to.have.been.called;
			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.render).to.have.been.calledThrice;

			expect(Inner.prototype.render.thirdCall)
				.to.have.been.calledWithMatch({ foo:'bar', i:3 })
				.and.to.have.returned(sinon.match({
					props: {
						j: 3,
						i: 3,
						foo: 'bar'
					}
				}));

			expect(getAttributes(scratch.firstElementChild)).to.eql({
				j: '3',
				i: '3',
				foo: 'bar'
			});


			// update & flush
			alt = true;
			doRender();
			rerender();

			expect(Inner.prototype.componentWillUnmount).to.have.been.calledOnce;

			expect(scratch.innerHTML).to.equal('<div is-alt="true"></div>');

			// update & flush
			alt = false;
			doRender();
			rerender();

			expect(sortAttributes(scratch.innerHTML)).to.equal(sortAttributes('<div foo="bar" j="4" i="5">inner</div>'));
		});

		it('should resolve intermediary functional component', () => {
			let ctx = {};
			class Root extends Component {
				getChildContext() {
					return { ctx };
				}
				render() {
					return <Func />;
				}
			}
			const Func = sinon.spy( () => <Inner /> );
			class Inner extends Component {
				componentWillMount() {
                    console.log("componentWillMount")
                }
				componentDidMount() {}
				componentWillUnmount() {}
				render() {
					return <div>inner</div>;
				}
            }

			spyAll(Inner.prototype);

            let root = render(<Root />, scratch);

			expect(Inner.prototype.componentWillMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount).to.have.been.calledOnce;
			expect(Inner.prototype.componentWillMount).to.have.been.calledBefore(Inner.prototype.componentDidMount);

			render(<asdf />, scratch, root);

			expect(Inner.prototype.componentWillUnmount).to.have.been.calledOnce;
		});

		it('should unmount children of high-order components without unmounting parent', () => {
			let outer, inner2, counter=0;

			class Outer extends Component {
				constructor(props, context) {
					super(props, context);
					outer = this;
					this.state = {
						child: this.props.child
					};
				}
				componentWillUnmount(){}
				componentWillMount(){}
				componentDidMount(){}
				render(_, { child:C }) {
					return <C />;
				}
			}
			spyAll(Outer.prototype);

			class Inner extends Component {
				componentWillUnmount(){}
				componentWillMount(){}
				componentDidMount(){}
				render() {
					return h('element'+(++counter));
				}
			}
			spyAll(Inner.prototype);

			class Inner2 extends Component {
				constructor(props, context) {
					super(props, context);
					inner2 = this;
				}
				componentWillUnmount(){}
				componentWillMount(){}
				componentDidMount(){}
				render() {
					return h('element'+(++counter));
				}
			}
			spyAll(Inner2.prototype);

			render(<Outer child={Inner} />, scratch);

			// outer should only have been mounted once
			expect(Outer.prototype.componentWillMount, 'outer initial').to.have.been.calledOnce;
			expect(Outer.prototype.componentDidMount, 'outer initial').to.have.been.calledOnce;
			expect(Outer.prototype.componentWillUnmount, 'outer initial').not.to.have.been.called;

			// inner should only have been mounted once
			expect(Inner.prototype.componentWillMount, 'inner initial').to.have.been.calledOnce;
			expect(Inner.prototype.componentDidMount, 'inner initial').to.have.been.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'inner initial').not.to.have.been.called;

			outer.setState({ child:Inner2 });
			outer.forceUpdate();

			expect(Inner2.prototype.render).to.have.been.calledOnce;

			// outer should still only have been mounted once
			expect(Outer.prototype.componentWillMount, 'outer swap').to.have.been.calledOnce;
			expect(Outer.prototype.componentDidMount, 'outer swap').to.have.been.calledOnce;
			expect(Outer.prototype.componentWillUnmount, 'outer swap').not.to.have.been.called;

			// inner should only have been mounted once
			expect(Inner2.prototype.componentWillMount, 'inner2 swap').to.have.been.calledOnce;
			expect(Inner2.prototype.componentDidMount, 'inner2 swap').to.have.been.calledOnce;
			expect(Inner2.prototype.componentWillUnmount, 'inner2 swap').not.to.have.been.called;

			inner2.forceUpdate();

			expect(Inner2.prototype.render, 'inner2 update').to.have.been.calledTwice;
			expect(Inner2.prototype.componentWillMount, 'inner2 update').to.have.been.calledOnce;
			expect(Inner2.prototype.componentDidMount, 'inner2 update').to.have.been.calledOnce;
			expect(Inner2.prototype.componentWillUnmount, 'inner2 update').not.to.have.been.called;
		});

		it('should remount when swapping between HOC child types', () => {
			class Outer extends Component {
				render({ child: Child }) {
					return <Child />;
				}
			}

			class Inner extends Component {
				componentWillMount() {}
				componentWillUnmount() {}
				render() {
					return <div class="inner">foo</div>;
				}
			}
			spyAll(Inner.prototype);

			const InnerFunc = () => (
				<div class="inner-func">bar</div>
			);

			let root = render(<Outer child={Inner} />, scratch, root);

			expect(Inner.prototype.componentWillMount, 'initial mount').to.have.been.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'initial mount').not.to.have.been.called;

			Inner.prototype.componentWillMount.resetHistory();
			root = render(<Outer child={InnerFunc} />, scratch, root);

			expect(Inner.prototype.componentWillMount, 'unmount').not.to.have.been.called;
			expect(Inner.prototype.componentWillUnmount, 'unmount').to.have.been.calledOnce;

			Inner.prototype.componentWillUnmount.resetHistory();
			root = render(<Outer child={Inner} />, scratch, root);

			expect(Inner.prototype.componentWillMount, 'remount').to.have.been.calledOnce;
			expect(Inner.prototype.componentWillUnmount, 'remount').not.to.have.been.called;
		});
	});

	describe('Component Nesting', () => {
		let useIntermediary = false;

		let createComponent = (Intermediary, name) => {
			class C extends Component {
				componentWillMount() {
                }
				render({ children }) {
					if (!useIntermediary) return Children.only(children);
					let I = useIntermediary===true ? Intermediary : useIntermediary;
                    const vnode = <I>{children}</I>;
                    return vnode
				}
			}
			spyAll(C.prototype);
			return C;
		};

		let createFunction = () => sinon.spy( ({ children }) => Children.only(children) );

		let root;
		let rndr = n => root = render(n, scratch, root);

		let F1 = createFunction();
		let F2 = createFunction();
		let F3 = createFunction();

		let C1 = createComponent(F1, 'C1');
		let C2 = createComponent(F2, 'C2');
		let C3 = createComponent(F3, 'C3');

		let reset = () => [C1, C2, C3].reduce(
			(acc, c) => acc.concat( Object.keys(c.prototype).map(key => c.prototype[key]) ),
			[F1, F2, F3]
		).forEach( c => c.reset && c.resetHistory() );


		it('should handle lifecycle for no intermediary in component tree', () => {
			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'initial mount').to.have.been.calledOnce;
			expect(C2.prototype.componentWillMount, 'initial mount').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'initial mount').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2>Some Text</C2></C1>);

			expect(C1.prototype.componentWillMount, 'unmount innermost, C1').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'unmount innermost, C2').not.to.have.been.called;

            reset();
			rndr(<C1><C3>Some Text</C3></C1>);

			expect(C1.prototype.componentWillMount, 'swap innermost').not.to.have.been.called;
			expect(C3.prototype.componentWillMount, 'swap innermost').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'inject between, C1').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'inject between, C2').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'inject between, C3').to.have.been.calledOnce;
		});


		it('should handle lifecycle for nested intermediary functional components', () => {
			useIntermediary = true;

			rndr(<div />);
			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'initial mount w/ intermediary fn, C1').to.have.been.calledOnce;
			expect(C2.prototype.componentWillMount, 'initial mount w/ intermediary fn, C2').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'initial mount w/ intermediary fn, C3').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2>Some Text</C2></C1>);

			expect(C1.prototype.componentWillMount, 'unmount innermost w/ intermediary fn, C1').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'unmount innermost w/ intermediary fn, C2').not.to.have.been.called;

			reset();
			rndr(<C1><C3>Some Text</C3></C1>);

			expect(C1.prototype.componentWillMount, 'swap innermost w/ intermediary fn').not.to.have.been.called;
			expect(C3.prototype.componentWillMount, 'swap innermost w/ intermediary fn').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'inject between, C1 w/ intermediary fn').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'inject between, C2 w/ intermediary fn').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'inject between, C3 w/ intermediary fn').to.have.been.calledOnce;
		});


		it('should handle lifecycle for nested intermediary elements', () => {
			useIntermediary = 'div';

			rndr(<div />);
			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'initial mount w/ intermediary div, C1').to.have.been.calledOnce;
			expect(C2.prototype.componentWillMount, 'initial mount w/ intermediary div, C2').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'initial mount w/ intermediary div, C3').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2>Some Text</C2></C1>);

			expect(C1.prototype.componentWillMount, 'unmount innermost w/ intermediary div, C1').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'unmount innermost w/ intermediary div, C2').not.to.have.been.called;

			reset();
			rndr(<C1><C3>Some Text</C3></C1>);

			expect(C1.prototype.componentWillMount, 'swap innermost w/ intermediary div').not.to.have.been.called;
			expect(C3.prototype.componentWillMount, 'swap innermost w/ intermediary div').to.have.been.calledOnce;

			reset();
			rndr(<C1><C2><C3>Some Text</C3></C2></C1>);

			expect(C1.prototype.componentWillMount, 'inject between, C1 w/ intermediary div').not.to.have.been.called;
			expect(C2.prototype.componentWillMount, 'inject between, C2 w/ intermediary div').to.have.been.calledOnce;
			expect(C3.prototype.componentWillMount, 'inject between, C3 w/ intermediary div').to.have.been.calledOnce;
		});
	});
});
