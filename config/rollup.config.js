import rollupTypescript from 'rollup-plugin-typescript'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

const isProduction = process.env.NODE_ENV === 'production'
export default {
    entry: 'src/index.ts',
    format: 'umd',
    moduleName: 'Zreact',
    dest: 'dist/zreact.js',
    plugins: isProduction ? [
        uglify({}, minify),
        rollupTypescript()
    ]: [rollupTypescript()],
    sourceMap: !isProduction
}