import rollupTypescript from 'rollup-plugin-typescript'
import replace from 'rollup-plugin-replace'
import alias from 'rollup-plugin-alias'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
export default {
    entry: 'src/zreact.ts',
	format: 'umd',
	moduleName: 'zreact',
    dest: 'dist/zreact.devtools.js',
    plugins: [
        rollupTypescriptPlugin,
        replace({
            DEVTOOLS_ENV: JSON.stringify(process.env.DEVTOOLS_ENV)
        }),
        alias({
            resolve: [".ts"],
            zreact: "./zreact"
        })
    ],
    sourceMap: true
}
