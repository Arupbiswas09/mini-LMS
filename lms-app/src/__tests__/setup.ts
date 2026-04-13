import '@testing-library/jest-native/extend-expect';

// ─── AsyncStorage ──────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ─── Expo Router ─────────────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Expo SecureStore ─────────────────────────────────────────────────────────
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(),
}));

// ─── MMKV ─────────────────────────────────────────────────────────────────────
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn(() => undefined),
    set: jest.fn(),
    getNumber: jest.fn(() => undefined),
    remove: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// ─── Expo Notifications ───────────────────────────────────────────────────────
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationHandler: jest.fn(),
}));

// ─── Expo Network ─────────────────────────────────────────────────────────────
jest.mock('expo-network', () => ({
  useNetworkState: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
  NetworkStateType: { WIFI: 'WIFI', CELLULAR: 'CELLULAR', UNKNOWN: 'UNKNOWN' },
}));

// ─── Expo Haptics ─────────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// ─── Expo Local Authentication ────────────────────────────────────────────────
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(false)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(false)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: false })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

// ─── Expo Web Browser ────────────────────────────────────────────────────────
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'opened' })),
}));

// ─── Reanimated ───────────────────────────────────────────────────────────────
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
