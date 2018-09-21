/* eslint-disable */
var renderToString = require('../server-render').renderToString;

// function dep(obj) { return obj['default'] || obj; }

module.exports = {
	renderToString: renderToString,
	renderToStaticMarkup: renderToString
};
