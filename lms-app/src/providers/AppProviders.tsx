import { type ReactNode, createContext, useContext } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, mmkvPersister } from '@/lib/queryClient';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastManager } from '@/components/common/ToastManager';
import { usePreferencesStore } from '@/stores/preferencesStore';

// ─── Theme context ────────────────────────────────────────────────────────────
interface ThemeContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

function ThemeContextBridge({ children }: { children: ReactNode }) {
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const toggleDarkMode = usePreferencesStore((s) => s.toggleDarkMode);
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── AppProviders ─────────────────────────────────────────────────────────────
interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composes all top-level providers in the correct dependency order:
 *
 * GestureHandlerRootView
 *   └─ SafeAreaProvider
 *       └─ PersistQueryClientProvider   ← React Query + MMKV cache persistence
 *           └─ ThemeProvider            ← NativeWind color scheme
 *               └─ ThemeContextBridge  ← Exposes useTheme() to the app
 *                   └─ {children}
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: mmkvPersister }}
          onSuccess={() => {
            // Cache restored from MMKV — trigger a background refetch so stale
            // data is refreshed without blocking the first render.
            void queryClient.resumePausedMutations();
            void queryClient.invalidateQueries();
          }}
        >
          <ThemeProvider>
            <ThemeContextBridge>
              {children}
              <ToastManager />
            </ThemeContextBridge>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
