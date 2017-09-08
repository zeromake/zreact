const rollupTypescript = require('rollup-plugin-typescript')
const uglify = require('rollup-plugin-uglify')
const { minify } = require('uglify-es')
const replace = require('rollup-plugin-replace')
const pkg = require('../package.json')
const commonjs = require('rollup-plugin-commonjs');

const isProduction = process.env.NODE_ENV === 'production'

const rollupTypescriptPlugin = rollupTypescript()
const replacePlugin = replace({
    VERSION_ENV: JSON.stringify(pkg.version),
    ENV: JSON.stringify(process.env.NODE_ENV)
})
const commonjsPlugin = commonjs({
    include: 'node_modules/**'
})

module.exports = {
    plugins: !isProduction ? [
        rollupTypescriptPlugin,
        replacePlugin,
        commonjsPlugin
    ] : [
        rollupTypescriptPlugin,
        uglify({}, minify),
        replacePlugin,
        commonjsPlugin
    ],
    sourcemap: !isProduction
}
