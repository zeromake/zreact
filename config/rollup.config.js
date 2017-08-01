import rollupTypescript from 'rollup-plugin-typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import pkg from '../package.json'
import replace from 'rollup-plugin-replace'
// import typescript from 'typescript'

const isProduction = process.env.NODE_ENV === 'production'

// set new typescript
const rollupTypescriptPlugin = rollupTypescript()
const replacePlugin = replace({
    DEVTOOLS_ENV: JSON.stringify(process.env.DEVTOOLS_ENV),
    ENV: JSON.stringify(process.env.NODE_ENV)
})
export default {
    entry: 'src/zreact.ts',
    moduleName: 'zreact',
    // dest: isProduction ? 'dist/zreact.min.js' : 'dist/zreact.js',
    plugins: !isProduction ? [
        rollupTypescriptPlugin,
        replacePlugin
    ] : [
        rollupTypescriptPlugin,
        uglify({}, minify),
        replacePlugin
    ],
    sourceMap: !isProduction,
    targets: isProduction ? [
        {
            format: 'umd',
            dest: pkg["minified:main"]
        }
    ] : [
        {
            format: 'umd',
            dest: pkg.main
        },
        {
            format: 'es',
            dest: pkg.module
        }
	]
}
