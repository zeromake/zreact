const baseConfig = require('./rollup.base.config')
const isProduction = process.env.NODE_ENV === 'production'

const config = Object.assign({
    input: 'src/compat.ts',
    external: ['zreact', 'prop-types'],
    output:[
        {
            globals: {
                zreact: 'zreact',
                'prop-types': 'prop-types'
            },
            name: 'zreact',
            format: 'es',
            file: 'dist/compat.js',
            sourcemap: !isProduction
        }
	]
}, baseConfig)

export default config
