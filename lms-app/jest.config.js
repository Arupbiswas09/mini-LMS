/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/src/__tests__/__mocks__/globalSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/__mocks__/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Stub Expo's winter runtime that uses `import.meta` (unsupported in Jest)
    'expo/src/winter/runtime(.*)': '<rootDir>/src/__tests__/__mocks__/expoRuntime.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(?!-av)|@expo|@legendapp|nativewind|react-native-reanimated|react-native-gesture-handler|react-native-mmkv|@tanstack|zustand|immer)',
  ],
  collectCoverageFrom: [
    'src/stores/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 9,
      branches: 6,
      functions: 9,
    },
    './src/stores/courseStore.ts': {
      lines: 75,
      branches: 80,
      functions: 75,
    },
    './src/lib/api/errorHandler.ts': {
      lines: 85,
      branches: 70,
      functions: 80,
    },
    './src/utils/courseMapper.ts': {
      lines: 70,
      branches: 50,
      functions: 70,
    },
  },
};
