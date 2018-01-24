import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript({typescript: require('typescript')})
export default {
    input: 'src/devtools-run.ts',
    external: ['zreact'],
    output: {
        globals: {
            zreact: 'zreact'
        },
        format: 'iife',
        file: 'devtools-run.js',
        sourcemap: true
    },
    plugins: [
        rollupTypescriptPlugin,
    ]
}
