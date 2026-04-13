import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { useCourse } from '@/hooks/useCourse';
import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import { useCourseStore } from '@/stores/courseStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAuthStore } from '@/stores/authStore';
import { secureStorage } from '@/lib/storage/secureStorage';
import { generateCourseHTML } from '@/lib/webview/htmlTemplate';
import { buildWebViewBootstrapScript } from '@/lib/webview/bootstrapScript';
import { WebViewProgressBar } from '@/components/webview/WebViewProgressBar';
import { WebViewError } from '@/components/webview/WebViewError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { BASE_URL } from '@/constants/api';

const ALLOWED_HOSTS = (() => {
  try {
    const hostname = new URL(BASE_URL).hostname;
    const bare = hostname.replace(/^www\./, '');
    return Array.from(new Set([hostname, bare]));
  } catch {
    return ['api.freeapi.app', 'freeapi.app'];
  }
})();
const APP_VERSION = '1.0.0';

export default function CourseWebViewScreen() {
  const raw = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(raw.id) ? raw.id[0] : raw.id;
  const router = useRouter();

  const [loadProgress, setLoadProgress] = useState(0);
  const [webViewKey, setWebViewKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [webContentReady, setWebContentReady] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({});

  const { data: course, isPending, isError, error, refetch } = useCourse(id);
  const { toggleBookmark, enrollCourse, isBookmarked, isEnrolled } = useCourseStore();
  const { isDarkMode } = usePreferencesStore();
  const user = useAuthStore((s) => s.user);

  const enrolled = course ? isEnrolled(course.id) : false;
  const bookmarked = course ? isBookmarked(course.id) : false;
  const displayName = user?.username?.trim() || user?.email?.trim() || 'Learner';

  const shareCourseNative = useCallback(async () => {
    if (!course) return;
    const message = `Check out this course: ${course.title}\n\nOpen in Mini LMS:\nmini-lms://course/${course.id}`;
    try {
      if (await Sharing.isAvailableAsync()) {
        const shareFile = new File(Paths.cache, `lms-course-share-${course.id}.txt`);
        if (!shareFile.exists) {
          shareFile.create();
        }
        shareFile.write(message);
        await Sharing.shareAsync(shareFile.uri, {
          mimeType: 'text/plain',
          UTI: 'public.plain-text',
          dialogTitle: course.title,
        });
        return;
      }
    } catch {
      // fall through
    }
    await Share.share({ title: course.title, message });
  }, [course]);

  const { webViewRef, injectTheme, injectEnrollmentStatus, handleMessage } = useWebViewBridge({
    courseId: course?.id ?? null,
    onBookmarkToggle: () => {
      if (course) toggleBookmark(course.id);
    },
    onEnrollCourse: () => {
      if (course && !enrolled) {
        enrollCourse(course.id);
      }
    },
    onShareCourse: () => {
      void shareCourseNative();
    },
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await secureStorage.getToken();
      if (cancelled) return;
      const h: Record<string, string> = {
        'X-App-Version': APP_VERSION,
        'X-Platform': Platform.OS,
      };
      if (token) h.Authorization = `Bearer ${token}`;
      setRequestHeaders(h);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    injectTheme(isDarkMode);
  }, [isDarkMode, injectTheme]);

  useEffect(() => {
    injectEnrollmentStatus(enrolled);
  }, [enrolled, injectEnrollmentStatus]);

  const htmlContent = useMemo(
    () => (course ? generateCourseHTML(course, enrolled, isDarkMode, displayName) : ''),
    [course, enrolled, isDarkMode, displayName]
  );

  const injectedBeforeContent = useMemo(() => buildWebViewBootstrapScript(displayName), [displayName]);

  const webSource = useMemo(
    () => ({
      html: htmlContent,
      baseUrl: BASE_URL,
      headers: requestHeaders,
    }),
    [htmlContent, requestHeaders]
  );

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setHasError(false);
    setWebContentReady(false);
    setLoadProgress(0);
    setWebViewKey((k) => k + 1);
    setTimeout(() => setIsRetrying(false), 800);
  }, []);

  const handleNavigationStateChange = useCallback((navState: { url: string }) => {
    const url = navState.url;
    if (url === 'about:blank' || url.startsWith('data:')) return;
    try {
      const { hostname } = new URL(url);
      if (!ALLOWED_HOSTS.includes(hostname)) {
        webViewRef.current?.stopLoading();
        void WebBrowser.openBrowserAsync(url);
      }
    } catch {
      // invalid URL
    }
  }, [webViewRef]);

  const onShouldStartLoadWithRequest = useCallback((req: { url: string }) => {
    const url = req.url;
    if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true;
    try {
      const { hostname } = new URL(url);
      if (ALLOWED_HOSTS.includes(hostname)) return true;
      void WebBrowser.openBrowserAsync(url);
      return false;
    } catch {
      return false;
    }
  }, []);

  if (!id) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center px-8">
        <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 text-center">Invalid course</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (isError || !course) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 text-center">
          {error instanceof Error ? error.message : 'Course not found'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-3" accessibilityRole="button">
          <Text className="text-primary-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const iconColor = isDarkMode ? '#f3f4f6' : '#374151';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
      <View className="flex-row items-center px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={iconColor} />
        </TouchableOpacity>
        <Text className="flex-1 text-sm font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
          {course.title}
        </Text>
        <TouchableOpacity
          onPress={() => toggleBookmark(course.id)}
          className="w-9 h-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={bookmarked ? '#2563eb' : iconColor}
          />
        </TouchableOpacity>
      </View>

      <WebViewProgressBar progress={loadProgress} hidden={hasError || (loadProgress >= 1 && webContentReady)} />

      {hasError ? (
        <WebViewError error={undefined} onRetry={handleRetry} isRetrying={isRetrying} />
      ) : (
        <View className="flex-1">
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={webSource}
            injectedJavaScriptBeforeContentLoaded={injectedBeforeContent}
            onLoadStart={() => {
              setWebContentReady(false);
              setLoadProgress(0);
            }}
            onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
            onLoadEnd={() => {
              setLoadProgress(1);
              setWebContentReady(true);
              injectTheme(isDarkMode);
              injectEnrollmentStatus(enrolled);
            }}
            onError={() => setHasError(true)}
            onHttpError={() => setHasError(true)}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            pullToRefreshEnabled={Platform.OS === 'ios'}
            refreshControlLightMode={isDarkMode}
            renderLoading={() => <View />}
          />
          {!webContentReady && !hasError ? (
            <View
              className="absolute inset-0 bg-white dark:bg-neutral-900 px-4 pt-4 gap-3"
              pointerEvents="none"
            >
              <SkeletonLoader variant="card" className="h-36 rounded-2xl" />
              <SkeletonLoader variant="line" className="w-2/3" />
              <SkeletonLoader variant="line" className="w-1/2" />
              <SkeletonLoader variant="listItem" />
              <SkeletonLoader variant="listItem" />
              <SkeletonLoader variant="listItem" />
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}
