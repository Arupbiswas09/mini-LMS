import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { storage } from '@/lib/storage/appStorage';
import type { ApiError } from '@/types';

// ─── Type-safe query key factory ─────────────────────────────────────────────
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (page: number) => [...queryKeys.courses.lists(), { page }] as const,
    detail: (id: string) => [...queryKeys.courses.all, 'detail', id] as const,
    infinite: () => [...queryKeys.courses.all, 'infinite'] as const,
  },
  instructors: {
    all: ['instructors'] as const,
    list: (page: number) => [...queryKeys.instructors.all, 'list', { page }] as const,
    infinite: () => [...queryKeys.instructors.all, 'infinite'] as const,
  },
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
  },
} as const;

// ─── QueryClient ──────────────────────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — data is fresh, no background refetch
      gcTime: 30 * 60 * 1000,          // 30 min — keep unused cache for offline use
      retry: (failureCount, error) => {
        const apiError = error as unknown as ApiError;
        // Never retry auth / permission / not-found errors — they won't change
        if (
          apiError?.type === 'auth' ||
          apiError?.type === 'permission' ||
          apiError?.type === 'not_found'
        ) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      // offlineFirst: serve cached data immediately without network check
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
      networkMode: 'offlineFirst',
      onError: (error) => {
        const apiError = error as unknown as ApiError;
        if (__DEV__) {
          console.error('[QueryClient] Mutation error:', apiError?.message ?? error);
        }
      },
    },
  },
});

// ─── MMKV-backed sync persister ───────────────────────────────────────────────
/**
 * Bridges React Query's sync-storage persister interface to MMKV.
 * MMKV is synchronous, so `createSyncStoragePersister` is the right choice
 * (no async overhead, no promises).
 *
 * The cache is serialised once per 1 s (throttleTime) to avoid thrashing
 * MMKV on every query update.
 */
export const mmkvPersister = createSyncStoragePersister({
  storage: {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.remove(key),
  },
  key: 'rq_cache_v1',
  throttleTime: 1000,
});
