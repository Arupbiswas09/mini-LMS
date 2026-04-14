import { act, renderHook } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { appStorage } from '@/lib/storage/appStorage';
import { analyticsService } from '@/services/analyticsService';
import { parseWebViewBridgeMessage } from '@/hooks/useWebViewBridge';
import { useWebViewBridge } from '@/hooks/useWebViewBridge';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(() => Promise.resolve({ type: 'opened' })),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    addLessonProgress: jest.fn(),
  },
}));

jest.mock('@/services/analyticsService', () => ({
  analyticsService: {
    track: jest.fn(() => Promise.resolve()),
  },
}));

const mockWebBrowser = WebBrowser as jest.Mocked<typeof WebBrowser>;
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;
const mockAppStorage = appStorage as jest.Mocked<typeof appStorage>;
const mockAnalytics = analyticsService as jest.Mocked<typeof analyticsService>;

describe('parseWebViewBridgeMessage', () => {
  it('parses valid LESSON_COMPLETE payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'LESSON_COMPLETE',
        payload: { lessonId: 'lesson_1' },
      })
    );

    expect(result).not.toBeNull();
    expect(result?.type).toBe('LESSON_COMPLETE');
  });

  it('rejects malformed JSON', () => {
    const result = parseWebViewBridgeMessage('{invalid json');
    expect(result).toBeNull();
  });

  it('rejects unknown message type', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'DELETE_ALL_DATA',
        payload: {},
      })
    );

    expect(result).toBeNull();
  });

  it('rejects OPEN_LINK with invalid URL payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'OPEN_LINK',
        payload: { url: 'not-a-url' },
      })
    );

    expect(result).toBeNull();
  });

  it('accepts ENROLL_COURSE with optional payload', () => {
    const result = parseWebViewBridgeMessage(
      JSON.stringify({
        type: 'ENROLL_COURSE',
      })
    );

    expect(result).not.toBeNull();
    expect(result?.type).toBe('ENROLL_COURSE');
  });
});

describe('useWebViewBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records lesson completion and analytics', () => {
    const { result } = renderHook(() =>
      useWebViewBridge({
        courseId: 'course-1',
        onBookmarkToggle: jest.fn(),
        onEnrollCourse: jest.fn(),
        onShareCourse: jest.fn(),
      })
    );

    act(() => {
      result.current.handleMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'LESSON_COMPLETE', payload: { lessonId: 'lesson-1' } }),
        },
      } as never);
    });

    expect(mockAppStorage.addLessonProgress).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1', lessonId: 'lesson-1' })
    );
    expect(mockAnalytics.track).toHaveBeenCalledWith('lesson_complete', {
      courseId: 'course-1',
      lessonId: 'lesson-1',
    });
  });

  it('routes bookmark, enroll, and share bridge actions', () => {
    const onBookmarkToggle = jest.fn();
    const onEnrollCourse = jest.fn();
    const onShareCourse = jest.fn();
    const { result } = renderHook(() =>
      useWebViewBridge({
        courseId: 'course-1',
        onBookmarkToggle,
        onEnrollCourse,
        onShareCourse,
      })
    );

    act(() => {
      result.current.handleMessage({ nativeEvent: { data: JSON.stringify({ type: 'BOOKMARK_TOGGLE' }) } } as never);
      result.current.handleMessage({ nativeEvent: { data: JSON.stringify({ type: 'ENROLL_COURSE' }) } } as never);
      result.current.handleMessage({ nativeEvent: { data: JSON.stringify({ type: 'SHARE_COURSE' }) } } as never);
    });

    expect(onBookmarkToggle).toHaveBeenCalledTimes(1);
    expect(onEnrollCourse).toHaveBeenCalledTimes(1);
    expect(onShareCourse).toHaveBeenCalledTimes(1);
  });

  it('opens allowed links and triggers haptics', () => {
    const { result } = renderHook(() =>
      useWebViewBridge({
        courseId: 'course-1',
        onBookmarkToggle: jest.fn(),
        onEnrollCourse: jest.fn(),
        onShareCourse: jest.fn(),
      })
    );

    act(() => {
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'OPEN_LINK', payload: { url: 'https://api.freeapi.app/docs' } }) },
      } as never);
      result.current.handleMessage({
        nativeEvent: { data: JSON.stringify({ type: 'HAPTIC', payload: { type: 'heavy' } }) },
      } as never);
    });

    expect(mockWebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://api.freeapi.app/docs');
    expect(mockHaptics.impactAsync).toHaveBeenCalledWith(mockHaptics.ImpactFeedbackStyle.Heavy);
  });

  it('injects theme and enrollment updates into the webview', () => {
    const injectJavaScript = jest.fn();
    const { result } = renderHook(() =>
      useWebViewBridge({
        courseId: 'course-1',
        onBookmarkToggle: jest.fn(),
        onEnrollCourse: jest.fn(),
        onShareCourse: jest.fn(),
      })
    );

    act(() => {
      result.current.webViewRef.current = { injectJavaScript } as never;
      result.current.injectTheme(true);
      result.current.injectEnrollmentStatus(false);
    });

    expect(injectJavaScript).toHaveBeenCalledTimes(2);
    expect(injectJavaScript.mock.calls[0]?.[0]).toContain('THEME_CHANGE');
    expect(injectJavaScript.mock.calls[1]?.[0]).toContain('ENROLLMENT_UPDATE');
  });
});
