import { Platform } from 'react-native';

export type AnalyticsEventName =
  | 'auth_login_success'
  | 'auth_register_success'
  | 'auth_logout'
  | 'course_view'
  | 'course_enroll'
  | 'course_bookmark_toggled'
  | 'lesson_complete';

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties?: Record<string, unknown>;
  createdAt: string;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

async function sendToSupabase(event: AnalyticsEvent): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      event_name: event.name,
      properties: event.properties ?? {},
      created_at: event.createdAt,
      platform: Platform.OS,
    }),
  });
}

export const analyticsService = {
  async track(name: AnalyticsEventName, properties?: Record<string, unknown>): Promise<void> {
    const event: AnalyticsEvent = {
      name,
      properties,
      createdAt: new Date().toISOString(),
    };

    if (__DEV__ && process.env.NODE_ENV !== 'test') {
      console.warn(`[Analytics] ${name}`, properties ?? {});
    }

    try {
      await sendToSupabase(event);
    } catch {
      // Non-blocking analytics.
    }
  },
} as const;
