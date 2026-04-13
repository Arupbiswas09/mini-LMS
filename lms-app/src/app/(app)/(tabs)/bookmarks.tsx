import React, { useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useCourseStore } from '@/stores/courseStore';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useInfiniteCourses } from '@/hooks/useCourses';
import { CourseCard } from '@/components/course/CourseCard';
import type { CourseWithInstructor } from '@/types';

export default function BookmarksScreen() {
  const router = useRouter();
  const { toggleBookmark, isBookmarked } = useCourseStore();
  const { bookmarkedCourses } = useBookmarks();
  const { isLoading } = useInfiniteCourses();

  const handleCoursePress = useCallback(
    (course: CourseWithInstructor) => {
      router.push(`/(app)/course/${course.id}`);
    },
    [router]
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
      <View className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Bookmarks</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {bookmarkedCourses.length} saved course{bookmarkedCourses.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : bookmarkedCourses.length === 0 ? (
        <Animated.View entering={FadeIn} className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-primary-50 items-center justify-center mb-6">
            <Ionicons name="bookmark-outline" size={40} color="#2563eb" />
          </View>
          <Text className="text-xl font-bold text-neutral-900 dark:text-white text-center mb-2">
            No bookmarks yet
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-center">
            Tap the heart on any course to save it for later
          </Text>
        </Animated.View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {bookmarkedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onPress={handleCoursePress}
              onBookmark={toggleBookmark}
              isBookmarked={isBookmarked(course.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
