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
    'src/stores/authStore.ts',
    'src/stores/courseStore.ts',
    'src/hooks/useDebounce.ts',
    'src/hooks/useWebViewBridge.ts',
    'src/lib/api/errorHandler.ts',
    'src/lib/api/refreshLifecycle.ts',
    'src/lib/storage/secureStorage.ts',
    'src/lib/security/jailbreakDetection.ts',
    'src/services/aiRecommendationService.ts',
    'src/services/courseService.ts',
    'src/services/downloadService.ts',
    'src/utils/courseMapper.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      branches: 60,
      functions: 70,
      statements: 75,
    },
  },
};
