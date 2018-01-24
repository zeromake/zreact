import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript({typescript: require('typescript')})
export default {
    input: 'src/devtools.ts',
    external: ['zreact'],
    output: {
        globals: {
            zreact: 'zreact'
        },
        format: 'es',
        file: 'devtools.js',
        sourcemap: true
    },
    plugins: [
        rollupTypescriptPlugin,
    ],
}
