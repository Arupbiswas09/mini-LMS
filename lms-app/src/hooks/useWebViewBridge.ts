import { useRef, useCallback, type RefObject } from 'react';
import type { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { appStorage } from '@/lib/storage/appStorage';

export interface WebViewBridgeMessage {
  type: string;
  payload?: Record<string, unknown>;
}

export interface UseWebViewBridgeParams {
  courseId: string | null;
  onBookmarkToggle: () => void;
  onShareCourse: () => void;
}

function injectNativeMessage(webViewRef: RefObject<WebView | null>, message: WebViewBridgeMessage): void {
  const json = JSON.stringify(message);
  webViewRef.current?.injectJavaScript(
    `(function(){try{if(window.__lmsApplyNativeMessage)window.__lmsApplyNativeMessage(${json});}catch(e){}true;})();`
  );
}

export function useWebViewBridge({ courseId, onBookmarkToggle, onShareCourse }: UseWebViewBridgeParams) {
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
      try {
        const message = JSON.parse(event.nativeEvent.data) as WebViewBridgeMessage;

        switch (message.type) {
          case 'LESSON_COMPLETE': {
            const lessonId = message.payload?.['lessonId'] as string | undefined;
            if (lessonId && courseId) {
              appStorage.addLessonProgress({
                lessonId,
                courseId,
                completedAt: new Date().toISOString(),
              });
            }
            break;
          }
          case 'BOOKMARK_TOGGLE':
            onBookmarkToggle();
            break;
          case 'SHARE_COURSE':
            onShareCourse();
            break;
          case 'OPEN_LINK': {
            const url = message.payload?.['url'] as string | undefined;
            if (url) void WebBrowser.openBrowserAsync(url);
            break;
          }
          case 'HAPTIC': {
            const kind = (message.payload?.['type'] as string) || 'medium';
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
      } catch {
        // malformed JSON from web
      }
    },
    [courseId, onBookmarkToggle, onShareCourse]
  );

  return {
    webViewRef,
    injectTheme,
    injectEnrollmentStatus,
    handleMessage,
  };
}
