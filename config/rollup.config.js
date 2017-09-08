const pkg = require('../package.json')
const baseConfig = require('./rollup.base.config')

const isProduction = process.env.NODE_ENV === 'production'

const config = Object.assign({
    input: 'src/zreact.ts',
    name: 'zreact',
    output: isProduction ? [
        {
            format: 'umd',
            file: pkg["minified:main"]
        }
    ] : [
        {
            format: 'umd',
            file: pkg.main
        },
        {
            format: 'es',
            file: pkg.module
        }
	]
}, baseConfig)

export default config
