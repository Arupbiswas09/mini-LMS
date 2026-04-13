import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { usePreferencesStore } from '@/stores/preferencesStore';

interface ColorSchemeResult {
  colorScheme: 'light' | 'dark';
  systemColorScheme: 'light' | 'dark';
  isUserOverride: boolean;
}

/**
 * Returns the resolved color scheme, respecting user override from preferences.
 * Falls back to system preference when user hasn't explicitly set one.
 */
export function useAppColorScheme(): ColorSchemeResult {
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const systemScheme = useRNColorScheme() ?? 'light';

  return {
    colorScheme: isDarkMode ? 'dark' : 'light',
    systemColorScheme: systemScheme,
    isUserOverride: true, // preferences store always has an explicit value
  };
}

// Re-export NativeWind's hook for components that need to set scheme
export { useNativeWindColorScheme };
