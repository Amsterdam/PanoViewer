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
    '!src/*.js',
    '!src/.*.js'
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 20,
      branches: 20,
      functions: 10,
      lines: 20
    }
  },
  coverageReporters: process.env.CI ? [
    'html',
    'text'
  ] : ['lcov'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '/demo/',
    '/node_modules/',
    '/test/'
  ],
  "globals": {
    "window": true,
    "document": true
  }
};
