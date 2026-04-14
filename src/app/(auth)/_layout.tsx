import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDarkMode = usePreferencesStore((state) => state.isDarkMode);

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const headerBg = isDarkMode ? Colors.neutral[900] : Colors.white;
  const headerTint = isDarkMode ? Colors.neutral[100] : Colors.neutral[900];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: Colors.primary[600],
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
          color: headerTint,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      <Stack.Screen name="register" options={{ title: 'Create account' }} />
    </Stack>
  );
}
