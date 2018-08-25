import { h, render, Component, options, findDOMNode, findVDom, createRef } from 'zreact';
/** @jsx h */

// gives call count and argument errors names (otherwise sinon just uses "spy"):
let spy = (name, ...args) => {
	let spy = sinon.spy(...args);
	spy.displayName = `spy('${name}')`;
	return spy;
};

describe('refs', () => {
	let scratch;

	before( () => {
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);
	});

	beforeEach( () => {
		scratch.innerHTML = '';
	});

	after( () => {
		scratch.parentNode.removeChild(scratch);
		scratch = null;
	});

	it('should invoke refs in render()', () => {
		let ref = spy('ref');
		const dom = render(<div ref={ref} />, scratch);
		expect(ref).to.have.been.calledOnce.and.calledWith(findVDom(dom));
	});
	it("options.ref function", () => {
		const oldref = options.ref;
		options.ref = () => 1;
		let ref = spy('ref');
		const dom = render(<div ref={ref} />, scratch);
		expect(ref).to.have.been.calledOnce.and.calledWith(1);
		options.ref = oldref;
	});

	it('should invoke refs in Component.render()', () => {
		let outer = spy('outer');
        let inner = spy('inner');
		class Foo extends Component {
			render() {
				return (
					<div ref={outer}>
						<span ref={inner} />
					</div>
				);
			}
		}
		const dom = render(<Foo />, scratch);

		expect(outer).to.have.been.calledWith(findVDom(dom));
		expect(inner).to.have.been.calledWith(findVDom(dom.firstChild));
	});

	it('should pass components to ref functions', () => {
		let ref = spy('ref'),
			instance;
		class Foo extends Component {
			constructor() {
				super();
				instance = this;
			}
			render() {
				return <div />;
			}
		}
		render(<Foo ref={ref} />, scratch);

		expect(ref).to.have.been.calledOnce.and.calledWith(instance);
	});

	it('should pass rendered DOM from functional components to ref functions', () => {
		let ref = spy('ref');

		const Foo = () => <div />;

		let root = render(<Foo ref={ref} />, scratch);
		expect(ref).to.have.been.calledOnce;

		ref.resetHistory();
		root = render(<Foo ref={ref} />, scratch, root);
		expect(ref).to.have.been.calledOnce;

		ref.resetHistory();
		root = render(<span />, scratch, root);
		expect(ref).to.have.been.calledOnce.and.calledWith(null);
	});

	it('should pass children to ref functions', () => {
		let outer = spy('outer'),
			inner = spy('inner'),
			InnermostComponent = 'span',
			rerender, inst;
		class Outer extends Component {
			constructor() {
				super();
				rerender = () => this.forceUpdate();
			}
			render() {
				return (
					<div>
						<Inner ref={outer} />
					</div>
				);
			}
		}
		class Inner extends Component {
			constructor() {
				super();
				inst = this;
			}
			render() {
				return <InnermostComponent ref={inner} />;
			}
		}

		let root = render(<Outer />, scratch);

		expect(outer).to.have.been.calledOnce.and.calledWith(inst);
		expect(inner).to.have.been.calledOnce.and.calledWith(findVDom(inst));

		outer.resetHistory();
		inner.resetHistory();

		rerender();

		expect(outer, 're-render').to.have.been.calledOnce.and.calledWith(inst);
		expect(inner, 're-render').not.to.have.been.called;

		inner.resetHistory();
		InnermostComponent = 'x-span';
		rerender();
		expect(inner, 're-render swap');
		expect(inner.firstCall, 're-render swap').to.have.been.calledWith(null);
		expect(inner.secondCall, 're-render swap').to.have.been.calledWith(findVDom(inst));
		InnermostComponent = 'span';

		outer.resetHistory();
		inner.resetHistory();

		root = render(<div />, scratch, root);

		expect(outer, 'unrender').to.have.been.calledOnce.and.calledWith(null);
		expect(inner, 'unrender').to.have.been.calledOnce.and.calledWith(null);
	});

	it('should pass high-order children to ref functions', () => {
		let outer = spy('outer'),
			inner = spy('inner'),
			innermost = spy('innermost'),
			InnermostComponent = 'span',
			outerInst,
			innerInst;
		class Outer extends Component {
			constructor() {
				super();
				outerInst = this;
			}
			render() {
				return <Inner ref={inner} />;
			}
		}
		class Inner extends Component {
			constructor() {
				super();
				innerInst = this;
			}
			render() {
				return <InnermostComponent ref={innermost} />;
			}
		}

		let root = render(<Outer ref={outer} />, scratch);

		expect(outer, 'outer initial').to.have.been.calledOnce.and.calledWith(outerInst);
		expect(inner, 'inner initial').to.have.been.calledOnce.and.calledWith(innerInst);
		expect(innermost, 'innerMost initial').to.have.been.calledOnce.and.calledWith(findVDom(innerInst));

		outer.resetHistory();
		inner.resetHistory();
		innermost.resetHistory();
		root = render(<Outer ref={outer} />, scratch, root);

		expect(outer, 'outer update').to.have.been.calledOnce.and.calledWith(outerInst);
		expect(inner, 'inner update').to.have.been.calledOnce.and.calledWith(innerInst);
		expect(innermost, 'innerMost update').not.to.have.been.called;

		innermost.resetHistory();
		InnermostComponent = 'x-span';
		root = render(<Outer ref={outer} />, scratch, root);
		expect(innermost, 'innerMost swap');
		expect(innermost.firstCall, 'innerMost swap').to.have.been.calledWith(null);
		expect(innermost.secondCall, 'innerMost swap').to.have.been.calledWith(findVDom(innerInst));
		InnermostComponent = 'span';

		outer.resetHistory();
		inner.resetHistory();
		innermost.resetHistory();
		root = render(<div />, scratch, root);

		expect(outer, 'outer unmount').to.have.been.calledOnce.and.calledWith(null);
		expect(inner, 'inner unmount').to.have.been.calledOnce.and.calledWith(null);
		expect(innermost, 'innerMost unmount').to.have.been.calledOnce.and.calledWith(null);
	});

	it('should not pass ref into component as a prop', () => {
		let foo = spy('foo'),
			bar = spy('bar');

		class Foo extends Component {
			render(){ return <div />; }
		}
		const Bar = spy('Bar', () => <div />);

		sinon.spy(Foo.prototype, 'render');

		render((
			<div>
				<Foo ref={foo} a="a" />
				<Bar ref={bar} b="b" />
			</div>
		), scratch);

		expect(Foo.prototype.render).to.have.been.calledWithMatch({ ref:sinon.match.falsy, a:'a' }, { }, { });
		expect(Bar).to.have.been.calledWithMatch({ b:'b', ref:sinon.match.falsy }, { });
	});

	// Test for #232
	it('should only null refs after unmount', () => {
		let root, outer, inner;

		class TestUnmount extends Component {
			componentWillUnmount() {
				expect(this.outer).to.have.property('base', outer);
				expect(this.inner).to.have.property('base', inner);

				setTimeout( () => {
					expect(this).to.have.property('outer', null);
					expect(this).to.have.property('inner', null);
				});
			}

			render() {
				return (
					<div id="outer" ref={ c => this.outer=c }>
						<div id="inner" ref={ c => this.inner=c } />
					</div>
				);
			}
		}

		sinon.spy(TestUnmount.prototype, 'componentWillUnmount');

		root = render(<div><TestUnmount /></div>, scratch, root);
		outer = scratch.querySelector('#outer');
		inner = scratch.querySelector('#inner');

		expect(TestUnmount.prototype.componentWillUnmount).not.to.have.been.called;

		root = render(<div />, scratch, root);

		expect(TestUnmount.prototype.componentWillUnmount).to.have.been.calledOnce;
	});

	it('should null and re-invoke refs when swapping component root element type', () => {
		let inst;

		class App extends Component {
			render() {
				return <div><Child /></div>;
			}
		}

		class Child extends Component {
			constructor(props, context) {
				super(props, context);
				this.state = { show:false };
				inst = this;
			}
			handleMount(){
            }
			render(_, { show }) {
				if (!show) return <div id="div" ref={this.handleMount}></div>;
				return <span id="span" ref={this.handleMount}>some test content</span>;
			}
		}
		sinon.spy(Child.prototype, 'handleMount');

		const dom = render(<App />, scratch);
		expect(inst.handleMount).to.have.been.calledOnce.and.calledWith(findVDom(dom.firstChild));
		inst.handleMount.resetHistory();

		inst.setState({ show:true });
		inst.forceUpdate();
		expect(inst.handleMount).to.have.been.calledTwice;
        expect(inst.handleMount.firstCall).to.have.been.calledWith(null);
		expect(inst.handleMount.secondCall).to.have.been.calledWith(findVDom(dom.firstChild));
		inst.handleMount.resetHistory();

		inst.setState({ show:false });
		inst.forceUpdate();
		expect(inst.handleMount).to.have.been.calledTwice;
		expect(inst.handleMount.firstCall).to.have.been.calledWith(null);
		expect(inst.handleMount.secondCall).to.have.been.calledWith(findVDom(dom.firstChild));
	});


	it('should add refs to components representing DOM nodes with no attributes if they have been pre-rendered', () => {
		// Simulate pre-render
		let parent = document.createElement('div');
		let child = document.createElement('div');
		parent.appendChild(child);
		scratch.appendChild(parent); // scratch contains: <div><div></div></div>

        let ref = spy('ref');


		class Wrapper {
			render() {
				return <div></div>;
			}
		}

        const dom = render(<div><Wrapper ref={ c => ref(findVDom(c)) } /></div>, scratch, scratch.firstChild);
		expect(ref).to.have.been.calledOnce.and.calledWith(findVDom(dom.firstChild));
	});

	it('createRef -> should add refs to components representing DOM nodes with no attributes if they have been pre-rendered', () => {
		// Simulate pre-render
		let parent = document.createElement('div');
		let child = document.createElement('div');
		parent.appendChild(child);
		scratch.appendChild(parent); // scratch contains: <div><div></div></div>

        let ref = createRef() //spy('ref');
		class Wrapper {
			render() {
				return <div></div>;
			}
		}

        let dom = render(<div><Wrapper ref={ ref } /></div>, scratch, scratch.firstChild);
		expect(findDOMNode(ref.current)).to.equal(dom.firstChild);
        dom = render(<div></div>, scratch, scratch.firstChild);
		expect(ref.current).to.equal(null);
	});
});
