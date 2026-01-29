const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/.backend/',
    '<rootDir>/e2e/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/setup.ts',
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.backend/',
    '<rootDir>/.next/standalone/',
    '<rootDir>/.next/',
  ],
  haste: {
    forceNodeFilesystemAPI: true,
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@apollo/client|graphql)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)