module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'babel-jest',
    },
    testMatch: ['**/tests/**/*.test.ts'],
  };