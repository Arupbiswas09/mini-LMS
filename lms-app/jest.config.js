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
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 65,
      functions: 70,
    },
  },
};
