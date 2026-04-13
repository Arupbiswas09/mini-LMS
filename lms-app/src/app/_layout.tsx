import '../../global.css';
import { useEffect } from 'react';
import { SplashScreen, Slot } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import { AppProviders } from '@/providers/AppProviders';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useAuthStore } from '@/stores/authStore';
import { useCourseStore } from '@/stores/courseStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { notificationService } from '@/services/notificationService';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppState } from '@/hooks/useAppState';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    release: `${Constants.expoConfig?.slug ?? 'mini-lms'}@${Constants.expoConfig?.version ?? '1.0.0'}`,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });

  Sentry.setTags({
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
  });
}

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);
  const hydrate = useCourseStore((s) => s.hydrate);
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);

  // Native feature hooks — must be called once at the root
  useNotifications();
  useAppState();
  useOfflineMode();

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
