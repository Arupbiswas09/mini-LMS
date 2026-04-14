import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/services/notificationService';

/**
 * Sets up foreground and tap notification listeners for the lifetime of the root layout.
 * Must only be called once (in the root `_layout.tsx`).
 */
export function useNotifications() {
  const router = useRouter();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const foregroundSub = Notifications.addNotificationReceivedListener(() => {
      // Notification arrived while app is foregrounded — the banner shows automatically
      // (setNotificationHandler is configured in notificationService.ts).
      // Add any foreground-specific side effects here if needed.
    });

    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isMounted.current) return;
      notificationService.handleNotificationResponse(response, (path) => {
        // Expo Router's router.push accepts paths as strings
        router.push(path as Parameters<typeof router.push>[0]);
      });
    });

    return () => {
      isMounted.current = false;
      foregroundSub.remove();
      tapSub.remove();
    };
  }, [router]);
}
