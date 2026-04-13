import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { showToast } from '@/components/common/ToastManager';
import { appStorage } from '@/lib/storage/appStorage';

interface PendingAction {
  type: string;
  payload: unknown;
}

interface UseOfflineModeResult {
  isOffline: boolean;
  queueAction: (action: PendingAction) => void;
  pendingActionCount: number;
}

export function useOfflineMode(): UseOfflineModeResult {
  const { isConnected } = useNetworkStatus();
  const isOffline = !isConnected;
  const queryClient = useQueryClient();
  const wasOfflineRef = useRef(isOffline);
  const pendingRef = useRef(appStorage.getPendingActions());

  const queueAction = useCallback((action: PendingAction) => {
    appStorage.addPendingAction(action);
    pendingRef.current = appStorage.getPendingActions();
    showToast('info', 'Saved offline. It will sync when network is back.', 2200);
  }, []);

  // Replay pending actions when coming back online
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      const pending = appStorage.getPendingActions();
      if (pending.length > 0) {
        showToast('info', `Syncing ${pending.length} offline action(s)...`, 1800);
        try {
          // Revalidate server data after reconnect.
          void queryClient.invalidateQueries();
          appStorage.clearPendingActions();
          pendingRef.current = [];
          showToast('success', `Synced ${pending.length} offline action(s).`, 2500);

          if (__DEV__) {
            console.warn(`[OfflineMode] Replayed ${pending.length} pending action(s)`);
          }
        } catch {
          showToast('error', 'Offline sync failed. Will retry on next reconnect.', 3500);
        }
      }
    }
    wasOfflineRef.current = isOffline;
  }, [isOffline, queryClient]);

  return {
    isOffline,
    queueAction,
    pendingActionCount: pendingRef.current.length,
  };
}
