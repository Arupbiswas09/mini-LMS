import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { UserPreferences, LessonProgress } from '@/types';

const SCHEMA_VERSION = 1;
const SCHEMA_VERSION_KEY = 'schema_version';

export const storage: MMKV = createMMKV({
  id: 'mini-lms-storage',
});

function migrateIfNeeded(): void {
  const storedVersion = storage.getNumber(SCHEMA_VERSION_KEY) ?? 0;
  if (storedVersion < SCHEMA_VERSION) {
    if (storedVersion === 0) {
      // v0 → v1: initial migration, nothing to do
    }
    storage.set(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  }
}

migrateIfNeeded();

const KEYS = {
  USER_PREFERENCES: 'user_preferences',
  BOOKMARKS: 'bookmarks',
  ENROLLED_COURSES: 'enrolled_courses',
  LAST_SEEN: 'last_seen',
  LESSON_PROGRESS: 'lesson_progress',
  LAST_OPENED_AT: 'last_opened_at',
  NOTIFICATION_IDS: 'notification_ids',
  DOWNLOAD_STATES: 'download_states',
  DOWNLOAD_INDEX: 'download_index',
  PENDING_ACTIONS: 'pending_actions',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  isDarkMode: false,
  notificationsEnabled: true,
  biometricEnabled: false,
  language: 'en',
  fontSize: 'medium',
};

export const appStorage = {
  // ─── Preferences ────────────────────────────────────────────────
  getPreferences(): UserPreferences {
    const raw = storage.getString(KEYS.USER_PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    try {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<UserPreferences>) };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  setPreferences(prefs: Partial<UserPreferences>): void {
    const current = appStorage.getPreferences();
    storage.set(KEYS.USER_PREFERENCES, JSON.stringify({ ...current, ...prefs }));
  },

  // ─── Bookmarks ──────────────────────────────────────────────────
  getBookmarks(): Set<string> {
    const raw = storage.getString(KEYS.BOOKMARKS);
    if (!raw) return new Set();
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  },

  setBookmarks(bookmarks: Set<string>): void {
    storage.set(KEYS.BOOKMARKS, JSON.stringify(Array.from(bookmarks)));
  },

  // ─── Enrolled Courses ────────────────────────────────────────────
  getEnrolledCourses(): Set<string> {
    const raw = storage.getString(KEYS.ENROLLED_COURSES);
    if (!raw) return new Set();
    try {
      return new Set(JSON.parse(raw) as string[]);
    } catch {
      return new Set();
    }
  },

  setEnrolledCourses(courses: Set<string>): void {
    storage.set(KEYS.ENROLLED_COURSES, JSON.stringify(Array.from(courses)));
  },

  // ─── Lesson Progress ────────────────────────────────────────────
  getLessonProgress(): LessonProgress[] {
    const raw = storage.getString(KEYS.LESSON_PROGRESS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LessonProgress[];
    } catch {
      return [];
    }
  },

  addLessonProgress(progress: LessonProgress): void {
    const current = appStorage.getLessonProgress();
    const updated = [...current.filter((p) => p.lessonId !== progress.lessonId), progress];
    storage.set(KEYS.LESSON_PROGRESS, JSON.stringify(updated));
  },

  // ─── Last Seen ──────────────────────────────────────────────────
  setLastSeen(courseId: string): void {
    storage.set(KEYS.LAST_SEEN, courseId);
  },

  getLastSeen(): string | undefined {
    return storage.getString(KEYS.LAST_SEEN);
  },

  // ─── App State ──────────────────────────────────────────────────
  setLastOpenedAt(isoString: string): void {
    storage.set(KEYS.LAST_OPENED_AT, isoString);
  },

  getLastOpenedAt(): string | undefined {
    return storage.getString(KEYS.LAST_OPENED_AT);
  },

  // ─── Notification IDs ───────────────────────────────────────────
  setNotificationId(key: string, id: string): void {
    const raw = storage.getString(KEYS.NOTIFICATION_IDS);
    const current: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    current[key] = id;
    storage.set(KEYS.NOTIFICATION_IDS, JSON.stringify(current));
  },

  getNotificationId(key: string): string | undefined {
    const raw = storage.getString(KEYS.NOTIFICATION_IDS);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[key];
  },

  // ─── Download States ─────────────────────────────────────────────
  getDownloadState(filename: string): { status: string; path?: string; size?: number } | undefined {
    const raw = storage.getString(KEYS.DOWNLOAD_STATES);
    if (!raw) return undefined;
    const all = JSON.parse(raw) as Record<string, { status: string; path?: string; size?: number }>;
    return all[filename];
  },

  setDownloadState(filename: string, state: { status: string; path?: string; size?: number }): void {
    const raw = storage.getString(KEYS.DOWNLOAD_STATES);
    const all = raw ? (JSON.parse(raw) as Record<string, { status: string; path?: string; size?: number }>) : {};
    all[filename] = state;
    storage.set(KEYS.DOWNLOAD_STATES, JSON.stringify(all));

    // Keep the index in sync
    const indexRaw = storage.getString(KEYS.DOWNLOAD_INDEX);
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(filename)) {
      index.push(filename);
      storage.set(KEYS.DOWNLOAD_INDEX, JSON.stringify(index));
    }
  },

  getDownloadIndex(): string[] {
    const raw = storage.getString(KEYS.DOWNLOAD_INDEX);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  },

  removeDownloadState(filename: string): void {
    const raw = storage.getString(KEYS.DOWNLOAD_STATES);
    if (raw) {
      const all = JSON.parse(raw) as Record<string, unknown>;
      delete all[filename];
      storage.set(KEYS.DOWNLOAD_STATES, JSON.stringify(all));
    }
    const indexRaw = storage.getString(KEYS.DOWNLOAD_INDEX);
    if (indexRaw) {
      const index = (JSON.parse(indexRaw) as string[]).filter((n) => n !== filename);
      storage.set(KEYS.DOWNLOAD_INDEX, JSON.stringify(index));
    }
  },

  // ─── Pending Actions (offline queue) ────────────────────────────
  getPendingActions(): Array<{ type: string; payload: unknown }> {
    const raw = storage.getString(KEYS.PENDING_ACTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Array<{ type: string; payload: unknown }>;
    } catch {
      return [];
    }
  },

  addPendingAction(action: { type: string; payload: unknown }): void {
    const current = appStorage.getPendingActions();
    storage.set(KEYS.PENDING_ACTIONS, JSON.stringify([...current, action]));
  },

  clearPendingActions(): void {
    storage.set(KEYS.PENDING_ACTIONS, JSON.stringify([]));
  },

  // ─── Clear All ──────────────────────────────────────────────────
  clearAll(): void {
    storage.clearAll();
    migrateIfNeeded();
  },
} as const;
