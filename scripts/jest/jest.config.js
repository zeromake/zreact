
module.exports = {
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    rootDir: process.cwd(),
    roots: ['<rootDir>/src'],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    setupTestFrameworkScriptFile: require.resolve('./setupTests.js'),
    coveragePathIgnorePatterns: ["<rootDir>/scripts"],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
