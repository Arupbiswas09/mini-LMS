import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/index" />;
  }

  return <Redirect href="/(auth)/login" />;
}
