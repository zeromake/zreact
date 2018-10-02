const rollupTypescript = require('rollup-plugin-typescript');
const { uglify } = require('rollup-plugin-uglify');
const { minify } = require('uglify-es');
const replace = require('rollup-plugin-re');
const license = require("rollup-plugin-license");
const filesize = require("rollup-plugin-filesize");
const pkg = require('../package.json');

const isProduction = process.env.NODE_ENV === 'production';

const rollupTypescriptPlugin = rollupTypescript({typescript: require('typescript')});
const replacePlugin = replace({
    replaces: {
        $version: JSON.stringify(pkg.version),
        $env: JSON.stringify(process.env.NODE_ENV)
    }
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
        uglify({}, minify),
        replacePlugin,
        licensePlugin,
        filesizePlugin,
    ]
};
