import '../../global.css';
import { useEffect } from 'react';
import { SplashScreen, Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { notificationService } from '@/services/notificationService';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppState } from '@/hooks/useAppState';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const hydrate = useCourseStore((s) => s.hydrate);
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);

  // Native feature hooks — must be called once at the root
  useNotifications();
  useAppState();

  const [fontsLoaded, fontError] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Inter: require('../../assets/fonts/Inter-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    void restoreSession();
    hydrate();
    void notificationService.requestPermissions();
  }, [restoreSession, hydrate]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isRestoringSession) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isRestoringSession]);

  if ((!fontsLoaded && !fontError) || isRestoringSession) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
