import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
export default {
    input: 'src/devtools-run.ts',
    external: ['zreact'],
    output: {
        format: 'umd',
        file: 'devtools.js'
    },
    globals: {
		zreact: 'zreact'
	},
    plugins: [
        rollupTypescriptPlugin,
    ],
    sourcemap: true
}
