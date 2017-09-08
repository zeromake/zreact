const baseConfig = require('./rollup.base.config')

const config = Object.assign({
    input: 'src/ie8.ts',
    name: 'zreact',
    output:[
        {
            format: 'umd',
            file: 'dist/zreact.ie8.js'
        }
	]
}, baseConfig)

export default config
