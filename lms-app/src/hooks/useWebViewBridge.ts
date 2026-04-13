import { useRef, useCallback, type RefObject } from 'react';
import type { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { validateUrl } from '@/lib/security';
import { analyticsService } from '@/services/analyticsService';
import { appStorage } from '@/lib/storage/appStorage';

export interface WebViewBridgeMessage {
  type: string;
  payload?: Record<string, unknown>;
}

const WebViewBridgeSchema = z.union([
  z.object({
    type: z.literal('LESSON_COMPLETE'),
    payload: z.object({ lessonId: z.string().min(1) }),
  }),
  z.object({ type: z.literal('BOOKMARK_TOGGLE'), payload: z.record(z.string(), z.unknown()).optional() }),
  z.object({ type: z.literal('ENROLL_COURSE'), payload: z.record(z.string(), z.unknown()).optional() }),
  z.object({ type: z.literal('SHARE_COURSE'), payload: z.record(z.string(), z.unknown()).optional() }),
  z.object({
    type: z.literal('OPEN_LINK'),
    payload: z.object({ url: z.string().url() }),
  }),
  z.object({
    type: z.literal('HAPTIC'),
    payload: z
      .object({ type: z.enum(['light', 'medium', 'heavy']).optional() })
      .optional(),
  }),
]);

export type ParsedWebViewBridgeMessage = z.infer<typeof WebViewBridgeSchema>;

export function parseWebViewBridgeMessage(raw: string): ParsedWebViewBridgeMessage | null {
  try {
    const parsed = JSON.parse(raw);
    const result = WebViewBridgeSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export interface UseWebViewBridgeParams {
  courseId: string | null;
  onBookmarkToggle: () => void;
  onEnrollCourse: () => void;
  onShareCourse: () => void;
}

function injectNativeMessage(webViewRef: RefObject<WebView | null>, message: WebViewBridgeMessage): void {
  const json = JSON.stringify(message);
  webViewRef.current?.injectJavaScript(
    `(function(){try{if(window.__lmsApplyNativeMessage)window.__lmsApplyNativeMessage(${json});}catch(e){}true;})();`
  );
}

export function useWebViewBridge({
  courseId,
  onBookmarkToggle,
  onEnrollCourse,
  onShareCourse,
}: UseWebViewBridgeParams) {
  const webViewRef = useRef<WebView>(null);

  const injectTheme = useCallback(
    (isDark: boolean) => {
      injectNativeMessage(webViewRef, { type: 'THEME_CHANGE', payload: { isDark } });
    },
    []
  );

  const injectEnrollmentStatus = useCallback((isEnrolled: boolean) => {
    injectNativeMessage(webViewRef, { type: 'ENROLLMENT_UPDATE', payload: { isEnrolled } });
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebViewBridgeMessage(event.nativeEvent.data);
      if (!message) {
        if (__DEV__) {
          console.warn('[WebViewBridge] Ignored invalid bridge payload');
        }
        return;
      }

      switch (message.type) {
        case 'LESSON_COMPLETE': {
          const lessonId = message.payload.lessonId;
          if (courseId) {
            appStorage.addLessonProgress({
              lessonId,
              courseId,
              completedAt: new Date().toISOString(),
            });

            void analyticsService.track('lesson_complete', {
              courseId,
              lessonId,
            });
          }
          break;
        }
        case 'BOOKMARK_TOGGLE':
          onBookmarkToggle();
          break;
        case 'ENROLL_COURSE':
          onEnrollCourse();
          break;
        case 'SHARE_COURSE':
          onShareCourse();
          break;
        case 'OPEN_LINK': {
          const { url } = message.payload;
          if (validateUrl(url)) {
            void WebBrowser.openBrowserAsync(url);
          }
          break;
        }
        case 'HAPTIC': {
          const kind = message.payload?.type ?? 'medium';
          const style =
            kind === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : kind === 'heavy'
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Medium;
          void Haptics.impactAsync(style);
          break;
        }
        default:
          break;
      }
    },
    [courseId, onBookmarkToggle, onEnrollCourse, onShareCourse]
  );

  return {
    webViewRef,
    injectTheme,
    injectEnrollmentStatus,
    handleMessage,
  };
}
