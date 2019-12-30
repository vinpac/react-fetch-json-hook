module.exports = {
  roots: [
    './src', // https://github.com/facebook/jest/issues/1395#issuecomment-419490847
    './test',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
  },
  setupFiles: ['react-app-polyfill/jsdom'],
  testMatch: [
    '<rootDir>/test/**/*.{spec,test}.{js,ts,tsx}',
    '<rootDir>/**/__tests__/**/*.{spec,test}.{js,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
  moduleNameMapper: {
    'src/(.*)$': '<rootDir>/src/$1',
    'test/(.*)$': '<rootDir>/test/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.test.json',
    },
  },
}
