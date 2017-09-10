import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
export default {
    input: 'src/devtools.ts',
    external: ['zreact'],
    output: {
        format: 'es',
        file: 'dist/devtools.js'
    },
    globals: {
		zreact: 'zreact'
	},
    plugins: [
        rollupTypescriptPlugin,
    ],
    sourcemap: true
}
