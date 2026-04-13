import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  BIOMETRIC_CREDENTIALS: 'auth_biometric_creds',
} as const;

const isSecureStoreAvailable = Platform.OS !== 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isSecureStoreAvailable) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export const secureStorage = {
  setToken: (token: string) => setItem(KEYS.ACCESS_TOKEN, token),

  getToken: () => getItem(KEYS.ACCESS_TOKEN),

  setRefreshToken: (token: string) => setItem(KEYS.REFRESH_TOKEN, token),

  getRefreshToken: () => getItem(KEYS.REFRESH_TOKEN),

  setBiometricCredentials: (credentials: { email: string; password: string }) =>
    setItem(KEYS.BIOMETRIC_CREDENTIALS, JSON.stringify(credentials)),

  getBiometricCredentials: async (): Promise<{ email: string; password: string } | null> => {
    const raw = await getItem(KEYS.BIOMETRIC_CREDENTIALS);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { email: string; password: string };
    } catch {
      return null;
    }
  },

  removeBiometricCredentials: async (): Promise<void> => {
    await deleteItem(KEYS.BIOMETRIC_CREDENTIALS);
  },

  clearAll: async (): Promise<void> => {
    await Promise.all([
      deleteItem(KEYS.ACCESS_TOKEN),
      deleteItem(KEYS.REFRESH_TOKEN),
      deleteItem(KEYS.BIOMETRIC_CREDENTIALS),
    ]);
  },
} as const;
