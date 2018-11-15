const rollupTypescript = require('rollup-typescript');
const { terser } = require('rollup-plugin-terser')
// const { uglify } = require('rollup-plugin-uglify');
// const { minify } = require('uglify-es');
const replace = require('rollup-plugin-re');
const license = require("rollup-plugin-license");
const filesize = require("rollup-plugin-filesize");
const pkg = require('../package.json');

const isProduction = process.env.NODE_ENV === 'production';

const rollupTypescriptPlugin = rollupTypescript({typescript: require('typescript')});
const replaceOptions = {};
if(isProduction) {
    replaceOptions['process.env.NODE_ENV'] = JSON.stringify(process.env.NODE_ENV)
}
const replacePlugin = replace({
    replaces: replaceOptions
});

const licensePlugin = license({
    banner: `zreact JavaScript Library v${pkg.version}
    https://github.com/zeromake/zreact
    Copyright zeromake <a390720046@gmail.com>
    license MIT
    Date ${JSON.stringify(new Date())}
    `
});

const filesizePlugin = filesize()

module.exports = {
    plugins: !isProduction ? [
        rollupTypescriptPlugin,
        replacePlugin,
        licensePlugin,
        filesizePlugin,
    ] : [
        rollupTypescriptPlugin,
        terser({
            module: true,
        }),
        replacePlugin,
        licensePlugin,
        filesizePlugin,
    ]
};
