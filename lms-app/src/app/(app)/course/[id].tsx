import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useCourse } from '@/hooks/useCourse';
import { useCourseStore } from '@/stores/courseStore';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { analyticsService } from '@/services/analyticsService';
import { EnrollButton } from '@/components/course/EnrollButton';
import { CurriculumList } from '@/components/course/CurriculumList';
import { RatingStars } from '@/components/ui/RatingStars';
import type { CourseWithInstructor } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CourseDetailScreen() {
  const raw = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(raw.id) ? raw.id[0] : raw.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const bookmarkPulse = useSharedValue(1);

  const { data: course, isPending, isError, error, refetch } = useCourse(id);
  const { toggleBookmark, isBookmarked, enrollCourse, isEnrolled } = useCourseStore();

  const bookmarked = course ? isBookmarked(course.id) : false;
  const enrolled = course ? isEnrolled(course.id) : false;

  const bookmarkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkPulse.value }],
  }));

  const handleBookmark = useCallback(() => {
    if (!course) return;
    bookmarkPulse.value = withSequence(
      withTiming(1.25, { duration: 120 }),
      withTiming(1, { duration: 160 })
    );
    toggleBookmark(course.id);
  }, [course, toggleBookmark, bookmarkPulse]);

  const handleEnroll = useCallback(() => {
    if (course) enrollCourse(course.id);
  }, [course, enrollCourse]);

  const handleShare = useCallback(async () => {
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
      // fall through to system share sheet
    }
    await Share.share({ title: course.title, message });
  }, [course]);

  const handleOpenWebView = useCallback(() => {
    if (course) router.push(`/(app)/webview/${course.id}`);
  }, [course, router]);

  const handleLessonPress = useCallback(
    (lessonNum: number) => {
      if (!course) return;
      if (!enrolled) {
        Alert.alert(
          'Lesson locked',
          'Please enroll first to open course lessons.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enroll now',
              onPress: () => enrollCourse(course.id),
            },
          ]
        );
        return;
      }

      router.push(`/(app)/webview/${course.id}?lesson=${lessonNum}`);
    },
    [course, enrolled, enrollCourse, router]
  );

  const relatedCourses = useMemo(() => {
    if (!course) return [] as CourseWithInstructor[];
    const infiniteData = queryClient.getQueryData<{
      pages: Array<{ data: CourseWithInstructor[] }>;
    }>(queryKeys.courses.infinite());
    if (!infiniteData) return [];
    const all = infiniteData.pages.flatMap((p) => p.data);
    return all
      .filter((c) => c.id !== course.id && c.category === course.category)
      .slice(0, 8);
  }, [course]);

  useEffect(() => {
    if (!course) return;
    void analyticsService.track('course_view', {
      courseId: course.id,
      category: course.category,
      difficulty: course.difficulty,
    });
  }, [course]);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((p) => !p);
  }, []);

  if (!id) {
    return (
      <View
        className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Invalid course</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isPending) {
    return (
      <View
        className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError || !course) {
    return (
      <View
        className="flex-1 bg-white dark:bg-neutral-900 items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 text-center">
          {isError && error instanceof Error ? error.message : 'Course not found'}
        </Text>
        <TouchableOpacity
          onPress={() => void refetch()}
          className="mt-6 bg-primary-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 py-2" accessibilityRole="button">
          <Text className="text-primary-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroTop = insets.top + 8;
  const scrollBottomPad = 140 + Math.max(insets.bottom, 20);
  const safeRating = Number.isFinite(Number(course.rating)) ? Number(course.rating) : 0;
  const safeRatingCount = Number.isFinite(Number(course.ratingCount)) ? Number(course.ratingCount) : 0;
  const safeEnrollmentCount = Number.isFinite(Number(course.enrollmentCount))
    ? Number(course.enrollmentCount)
    : 0;
  const safeDuration = Number.isFinite(Number(course.duration)) ? Number(course.duration) : 0;
  const safeLessonsCount = Number.isFinite(Number(course.lessonsCount)) ? Number(course.lessonsCount) : 0;

  return (
    <View className="flex-1 bg-white dark:bg-neutral-900">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      >
        <View className="relative">
          <Image
            source={{ uri: course.thumbnail }}
            style={{ width: '100%', height: 260 }}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 160,
            }}
          />
          <View
            className="absolute left-0 right-0 flex-row items-center justify-between px-4"
            style={{ top: heroTop }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share course"
              >
                <Ionicons name="share-outline" size={20} color="white" />
              </TouchableOpacity>
              <Animated.View style={bookmarkAnimStyle}>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
                  onPress={handleBookmark}
                  accessibilityRole="button"
                  accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  accessibilityState={{ selected: bookmarked }}
                >
                  <Ionicons
                    name={bookmarked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={bookmarked ? '#f87171' : 'white'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
          <View className="absolute bottom-4 left-4 right-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-primary-500/90 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">{course.category}</Text>
              </View>
              <View className="ml-2 bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">{course.difficulty}</Text>
              </View>
            </View>
            <Text className="text-2xl font-bold text-white">{course.title}</Text>
            <View className="flex-row items-center mt-2 flex-wrap">
              <RatingStars
                rating={safeRating}
                size={14}
                starColor="#fcd34d"
                emptyStarColor="rgba(255,255,255,0.45)"
              />
              <Text className="text-white/90 text-sm ml-2">
                {safeRating.toFixed(1)} · {safeRatingCount.toLocaleString()} reviews ·{' '}
                {safeEnrollmentCount.toLocaleString()} students
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-5">
          {course.instructor ? (
            <Pressable
              className="flex-row items-center mb-5 bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel={`Instructor ${course.instructor.name}`}
              accessibilityHint="Instructor profile coming soon"
            >
              <Image
                source={{ uri: course.instructor.avatar }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
                transition={200}
              />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {course.instructor.name}
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {course.instructor.specialty}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </Pressable>
          ) : null}

          <View>
            <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              About this course
            </Text>
            <Text
              className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed"
              numberOfLines={expanded ? undefined : 4}
            >
              {course.description}
            </Text>
            <TouchableOpacity
              onPress={toggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Show less' : 'Show more'}
            >
              <Text className="text-primary-600 text-sm font-medium mt-1">
                {expanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap mt-5 gap-3">
            {[
              { icon: 'time-outline' as const, label: `${safeDuration}h total` },
              { icon: 'library-outline' as const, label: `${safeLessonsCount} lessons` },
              { icon: 'globe-outline' as const, label: course.language },
              { icon: 'cellular-outline' as const, label: course.difficulty },
            ].map((stat) => (
              <View
                key={stat.label}
                className="flex-row items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2"
              >
                <Ionicons name={stat.icon} size={16} color="#6b7280" />
                <Text className="text-xs text-neutral-600 dark:text-neutral-400 ml-1.5">{stat.label}</Text>
              </View>
            ))}
          </View>

          <CurriculumList
            courseId={course.id}
            lessonsCount={safeLessonsCount}
            isEnrolled={enrolled}
            onLessonPress={handleLessonPress}
          />

          {relatedCourses.length > 0 ? (
            <View className="mt-8 mb-4">
              <Text className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
                Related courses
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {relatedCourses.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => router.push(`/(app)/course/${c.id}`)}
                    className="mr-3 w-40 rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    accessibilityRole="button"
                    accessibilityLabel={c.title}
                  >
                    <Image
                      source={{ uri: c.thumbnail }}
                      style={{ width: '100%', height: 88 }}
                      contentFit="cover"
                    />
                    <Text className="text-xs font-semibold text-neutral-900 dark:text-white p-2" numberOfLines={2}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="flex-row gap-3">
          <EnrollButton isEnrolled={enrolled} onEnroll={handleEnroll} />
          <TouchableOpacity
            className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3.5 rounded-xl items-center justify-center"
            onPress={handleOpenWebView}
            accessibilityRole="button"
            accessibilityLabel="Open course in WebView"
          >
            <Ionicons name="open-outline" size={22} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
