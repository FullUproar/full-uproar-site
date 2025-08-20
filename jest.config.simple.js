module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.test.tsx'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/index.ts'
  ]
};