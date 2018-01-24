const rollupTypescript = require('rollup-plugin-typescript')
const uglify = require('rollup-plugin-uglify')
const { minify } = require('uglify-es')
const replace = require('rollup-plugin-replace')
const pkg = require('../package.json')

const isProduction = process.env.NODE_ENV === 'production'

const rollupTypescriptPlugin = rollupTypescript({typescript: require('typescript')})
const replacePlugin = replace({
    VERSION_ENV: JSON.stringify(pkg.version),
    ENV: JSON.stringify(process.env.NODE_ENV)
})

module.exports = {
    plugins: !isProduction ? [
        rollupTypescriptPlugin,
        replacePlugin
    ] : [
        rollupTypescriptPlugin,
        uglify({}, minify),
        replacePlugin
    ]
}
