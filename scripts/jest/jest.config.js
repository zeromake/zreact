
const moduleNameMapper = {
    "^@/(.*)$": "<rootDir>/src/$1",
}
const modules = [
    [
        "zreact-core",
        "core"
    ],
    [
        "zreact-fiber",
        "fiber"
    ],
    [
        "zreact-render",
        "render"
    ]
]
modules.forEach((i => {
    moduleNameMapper[`^${i[0]}$`] = `<rootDir>/src/${i[1]}`;
    moduleNameMapper[`^${i[0]}/(.*)$`] = `<rootDir>/src/${i[1]}/$1`;
}));

module.exports = {
    moduleNameMapper,
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
