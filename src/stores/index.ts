/**
 * ─── State Ownership Map ───────────────────────────────────────────────────
 *
 * | Concern                | Owner                                          |
 * |------------------------|------------------------------------------------|
 * | Auth (user, tokens)    | authStore  (Zustand, SecureStore)              |
 * | Server / API data      | React Query cache (infinite courses, detail,   |
 * |                        |   user profile)                                |
 * | Bookmarks / Enrollment | courseStore (Zustand, MMKV)                    |
 * | User preferences       | preferencesStore (Zustand, MMKV, sync init)    |
 * | UI state               | local useState — never lifted to global store  |
 *
 * Principle: granular selectors everywhere — selecting the whole store object
 * causes every subscriber to re-render on ANY field change.
 * ──────────────────────────────────────────────────────────────────────────
 */

export { useAuthStore } from './authStore';
export { useCourseStore, type CourseFilter } from './courseStore';
export { usePreferencesStore } from './preferencesStore';

// ─── Granular auth selectors ─────────────────────────────────────────────────
import { useAuthStore } from './authStore';

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useIsRestoringSession = () => useAuthStore((s) => s.isRestoringSession);

// ─── Granular course selectors ────────────────────────────────────────────────
import { useCourseStore } from './courseStore';

export const useBookmarks = () => useCourseStore((s) => s.bookmarks);
export const useBookmarkCount = () => useCourseStore((s) => s.bookmarks.size);
export const useIsBookmarked = (id: string) => useCourseStore((s) => s.isBookmarked(id));
export const useEnrolledCourses = () => useCourseStore((s) => s.enrolledCourses);
export const useIsEnrolled = (id: string) => useCourseStore((s) => s.isEnrolled(id));
export const useActiveFilter = () => useCourseStore((s) => s.activeFilter);
export const useSearchQuery = () => useCourseStore((s) => s.searchQuery);

// ─── Granular preferences selectors ─────────────────────────────────────────
import { usePreferencesStore } from './preferencesStore';

export const useIsDarkMode = () => usePreferencesStore((s) => s.isDarkMode);
export const useNotificationsEnabled = () => usePreferencesStore((s) => s.notificationsEnabled);
export const useBiometricEnabled = () => usePreferencesStore((s) => s.biometricEnabled);
export const useLanguage = () => usePreferencesStore((s) => s.language);
export const useFontSize = () => usePreferencesStore((s) => s.fontSize);

// ─── Composed useAppStore ─────────────────────────────────────────────────────
/**
 * Reads a minimal cross-slice snapshot for the rare case where code needs
 * values from multiple stores at once. Each field comes from a granular
 * selector so only the relevant store slice triggers a re-render.
 *
 * Prefer the individual selector hooks above in per-screen code.
 */
export function useAppStore() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const bookmarkCount = useCourseStore((s) => s.bookmarks.size);
  const activeFilter = useCourseStore((s) => s.activeFilter);

  return { user, isAuthenticated, isDarkMode, bookmarkCount, activeFilter };
}
