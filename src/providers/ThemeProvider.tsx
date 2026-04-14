import { useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'nativewind';
import { usePreferencesStore } from '@/stores/preferencesStore';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, setColorScheme]);

  return <>{children}</>;
}
