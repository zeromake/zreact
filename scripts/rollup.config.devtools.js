const pkg = require('../package.json')
const baseConfig = require('./rollup.base.config')

const isProduction = process.env.NODE_ENV === 'production'
const name = 'zreact'

const config = Object.assign({
    input: 'src/devtools/index.ts',
    external: ['zreact'],
    output: [
        {
            globals: {
                zreact: 'zreact'
            },
            name,
            format: 'umd',
            file: 'lib/devtools.js',
            sourcemap: !isProduction
        }
    ]
}, baseConfig)

export default config
