import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { notificationService } from '@/services/notificationService';
import { appStorage } from '@/lib/storage/appStorage';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryClient';

/**
 * Tracks app foreground / background transitions.
 *
 * On foreground:
 *  - Records `lastOpenedAt` in MMKV.
 *  - Cancels the inactivity reminder (user is active again).
 *  - Triggers a background refetch of the infinite courses list so
 *    data is fresh without a full pull-to-refresh.
 *
 * On background:
 *  - Schedules the 24-hour inactivity reminder.
 *
 * Must only be called once (in root `_layout.tsx`).
 */
export function useAppState() {
  const lastStatus = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleChange = (nextStatus: AppStateStatus) => {
      const prev = lastStatus.current;
      lastStatus.current = nextStatus;

      if (nextStatus === 'active' && prev !== 'active') {
        appStorage.setLastOpenedAt(new Date().toISOString());
        void notificationService.cancelInactivityReminder();
        // Invalidate server data so stale content refreshes in the background
        void queryClient.invalidateQueries({ queryKey: queryKeys.courses.infinite() });
      }

      if ((nextStatus === 'background' || nextStatus === 'inactive') && prev === 'active') {
        void notificationService.scheduleInactivityReminder();
      }
    };

    const sub = AppState.addEventListener('change', handleChange);

    // Record the very first open as well
    appStorage.setLastOpenedAt(new Date().toISOString());
    void notificationService.cancelInactivityReminder();

    return () => sub.remove();
  }, []);
}
