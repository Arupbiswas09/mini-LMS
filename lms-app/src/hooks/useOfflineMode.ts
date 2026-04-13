import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
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
  }, []);

  // Replay pending actions when coming back online
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline) {
      const pending = appStorage.getPendingActions();
      if (pending.length > 0) {
        // Invalidate all queries so data is refreshed
        void queryClient.invalidateQueries();
        appStorage.clearPendingActions();
        pendingRef.current = [];

        if (__DEV__) {
          console.warn(`[OfflineMode] Replayed ${pending.length} pending action(s)`);
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
