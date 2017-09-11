const baseConfig = require('./rollup.base.config')

const config = Object.assign({
    input: 'src/compat.ts',
    name: 'zreact',
    external: ['zreact', 'prop-types'],
    globals: {
        zreact: 'zreact',
        'prop-types': 'prop-types'
	},
    output:[
        {
            format: 'es',
            file: 'dist/compat.js'
        }
	]
}, baseConfig)

export default config
