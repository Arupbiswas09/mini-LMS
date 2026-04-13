import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from '@/components/ui/RatingStars';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import type { CourseWithInstructor } from '@/types';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({
  text,
  query,
  className,
  numberOfLines,
}: {
  text: string;
  query: string;
  className: string;
  numberOfLines?: number;
}) {
  const parts = useMemo(() => {
    const q = query.trim();
    if (!q) return [{ text, match: false }];
    const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
    return text.split(re).map((segment) => ({
      text: segment,
      match: segment.toLowerCase() === q.toLowerCase(),
    }));
  }, [text, query]);

  return (
    <Text className={className} numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.match ? (
          <Text key={i} className="bg-warning-100 dark:bg-amber-900/40 rounded px-0.5">
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
}

export interface CourseCardProps {
  course: CourseWithInstructor;
  onPress: (course: CourseWithInstructor) => void;
  /** Optional long-press handler — used for prefetching detail data */
  onLongPress?: (course: CourseWithInstructor) => void;
  onBookmark: (courseId: string) => void;
  isBookmarked: boolean;
  isLoading?: boolean;
  highlightQuery?: string;
}

function CourseCardComponent({
  course,
  onPress,
  onLongPress,
  onBookmark,
  isBookmarked,
  isLoading,
  highlightQuery = '',
}: CourseCardProps) {
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(course);
  }, [onPress, course]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(course);
  }, [onLongPress, course]);

  const handleBookmark = useCallback(() => {
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    onBookmark(course.id);
  }, [heartScale, onBookmark, course.id]);

  if (isLoading) {
    return (
      <View className="mb-4 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700">
        <SkeletonLoader variant="card" className="h-40 rounded-none" />
        <View className="p-3.5 gap-2">
          <SkeletonLoader variant="line" className="w-3/4" />
          <SkeletonLoader variant="line" className="w-1/2" />
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[cardStyle, { marginBottom: 16 }]}>
      <View className="bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-700 relative">
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${course.title} course by ${course.instructor?.name ?? 'Unknown'}`}
          accessibilityHint="Double-tap to open. Long-press to preload."
        >
          <View className="relative">
            {/* force-cache: thumbnail is immutable per course — no need to ever re-fetch */}
            <Image
              source={{ uri: course.thumbnail }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              contentFit="cover"
              transition={300}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              cachePolicy="disk"
              accessibilityLabel={`${course.title} thumbnail`}
            />
            <View className="absolute top-2 left-2 bg-primary-600/90 px-2.5 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">{course.category}</Text>
            </View>
          </View>

          <View className="p-3.5">
            <HighlightedText
              text={course.title}
              query={highlightQuery}
              className="text-base font-semibold text-neutral-900 dark:text-white leading-snug"
              numberOfLines={2}
            />

            {course.instructor ? (
              <View className="flex-row items-center mt-2">
                <Image
                  source={{ uri: course.instructor.avatar }}
                  style={{ width: 20, height: 20, borderRadius: 10 }}
                  contentFit="cover"
                />
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-1.5" numberOfLines={1}>
                  {course.instructor.name}
                </Text>
              </View>
            ) : null}

            <View className="flex-row items-center justify-between mt-3">
              <RatingStars rating={course.rating} size={12} showCount count={course.ratingCount} />
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">{course.duration}h</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-base font-bold text-primary-600">${course.price.toFixed(2)}</Text>
              <View className="bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-neutral-600 dark:text-neutral-400">{course.difficulty}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <Animated.View
          style={[heartStyle, { position: 'absolute', top: 8, right: 8 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={handleBookmark}
            className="w-9 h-9 rounded-full bg-white/90 items-center justify-center"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            accessibilityState={{ selected: isBookmarked }}
          >
            <Ionicons
              name={isBookmarked ? 'heart' : 'heart-outline'}
              size={18}
              color={isBookmarked ? '#ef4444' : '#374151'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function areEqual(prev: CourseCardProps, next: CourseCardProps): boolean {
  return (
    prev.course.id === next.course.id &&
    prev.isBookmarked === next.isBookmarked &&
    (prev.highlightQuery ?? '') === (next.highlightQuery ?? '') &&
    prev.isLoading === next.isLoading &&
    prev.onLongPress === next.onLongPress
  );
}

export const CourseCard = memo(CourseCardComponent, areEqual);
