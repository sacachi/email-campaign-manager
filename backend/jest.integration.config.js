/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...require('./jest.config.js'),
  testPathPattern: 'integration',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/helpers/setup.ts'],
};
