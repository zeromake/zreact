const baseConfig = require('./rollup.base.config')

const isProduction = process.env.NODE_ENV === 'production'
const config = Object.assign({
    input: 'src/ie8.ts',
    output:[
        {
            name: 'zreact',
            format: 'umd',
            file: 'dist/zreact.ie8.js',
            sourcemap: !isProduction
        }
	]
}, baseConfig)

export default config
