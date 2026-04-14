import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { appStorage } from '@/lib/storage/appStorage';
import type { UserPreferences } from '@/types';

type PreferencesState = UserPreferences;

interface PreferencesActions {
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setNotificationsEnabled: (value: boolean) => void;
  setBiometricEnabled: (value: boolean) => void;
  setLanguage: (language: string) => void;
  setFontSize: (size: UserPreferences['fontSize']) => void;
  resetPreferences: () => void;
}

type PreferencesStore = PreferencesState & PreferencesActions;

const initialPreferences = appStorage.getPreferences();

export const usePreferencesStore = create<PreferencesStore>()(
  devtools(
    immer((set, get) => ({
      ...initialPreferences,

      setDarkMode: (value) => {
        set((state) => {
          state.isDarkMode = value;
        });
        appStorage.setPreferences({ isDarkMode: get().isDarkMode });
      },

      toggleDarkMode: () => {
        set((state) => {
          state.isDarkMode = !state.isDarkMode;
        });
        appStorage.setPreferences({ isDarkMode: get().isDarkMode });
      },

      setNotificationsEnabled: (value) => {
        set((state) => {
          state.notificationsEnabled = value;
        });
        appStorage.setPreferences({ notificationsEnabled: get().notificationsEnabled });
      },

      setBiometricEnabled: (value) => {
        set((state) => {
          state.biometricEnabled = value;
        });
        appStorage.setPreferences({ biometricEnabled: get().biometricEnabled });
      },

      setLanguage: (language) => {
        set((state) => {
          state.language = language;
        });
        appStorage.setPreferences({ language: get().language });
      },

      setFontSize: (size) => {
        set((state) => {
          state.fontSize = size;
        });
        appStorage.setPreferences({ fontSize: get().fontSize });
      },

      resetPreferences: () => {
        const defaults = {
          isDarkMode: false,
          notificationsEnabled: true,
          biometricEnabled: false,
          language: 'en',
          fontSize: 'medium' as const,
        };
        set((state) => {
          Object.assign(state, defaults);
        });
        appStorage.setPreferences(defaults);
      },
    })),
    { name: 'preferences-store' }
  )
);
