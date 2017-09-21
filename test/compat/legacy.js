import React from '../legacy';

const h = React.createElement;

describe('legacy', () => {
	it('should export server', () => {
		expect(React).to.have.property('renderToStaticMarkup')
	});

	it('should export compat', () => {
		expect(React).to.have.property('createElement')
		expect(React).to.have.property('render')
	});
});
