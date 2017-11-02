import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
export default {
    input: 'src/devtools-run.ts',
    external: ['zreact'],
    output: {
        format: 'iife',
        file: 'devtools-run.js'
    },
    globals: {
		zreact: 'zreact'
	},
    plugins: [
        rollupTypescriptPlugin,
    ],
    sourcemap: true
}
