import rollupTypescript from 'rollup-plugin-typescript'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
export default {
    entry: 'src/devtools-run.ts',
    external: ['zreact'],
	format: 'umd',
    dest: 'devtools.js',
    globals: {
		zreact: 'zreact'
	},
    plugins: [
        rollupTypescriptPlugin,
    ],
    sourceMap: true
}
