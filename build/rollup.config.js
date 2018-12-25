const pkg = require('../package.json')
const baseConfig = require('./rollup.base.config')

const isProduction = process.env.NODE_ENV === 'production'
const name = 'zreact'

const config = Object.assign({
    input: 'src/index.ts',
    output: isProduction ? [
        {
            name,
            format: 'umd',
            file: pkg["minified:main"],
            sourcemap: !isProduction
        }
    ] : [
        {
            name,
            format: 'umd',
            file: pkg.main,
            sourcemap: !isProduction
        },
        {
            name,
            format: 'es',
            file: pkg.module,
            sourcemap: !isProduction
        }
	]
}, baseConfig)

export default config
