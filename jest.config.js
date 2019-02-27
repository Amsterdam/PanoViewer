module.exports = {
  displayName: 'test',
  rootDir: './',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!**/*.constant.js',
    '!**/*.config.js',
    '!**/*.mock.js',
    '!**/index.js',
    '!src/shared-atlas/**/*.js'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  },
  coverageReporters: process.env.CI
    ? [ 'html','text-summary' ]
    : [ 'lcov', 'text-summary'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/demo/',
    '/node_modules/',
    '/test/'
  ],
  "setupFiles" : ["<rootDir>/scripts/setupFile.js"]
};
