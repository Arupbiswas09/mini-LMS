import { useRef, useEffect, useCallback, memo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { CourseWithInstructor } from '@/types';

const AUTO_MS = 4000;
/** Horizontal padding on catalog list (16 * 2) — keep in sync with `(tabs)/index` LegendList contentContainerStyle */
const CATALOG_LIST_HORIZONTAL_PAD = 32;

export interface FeaturedBannerProps {
  courses: CourseWithInstructor[];
}

function FeaturedBannerComponent({ courses }: FeaturedBannerProps) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = Math.max(1, windowWidth - CATALOG_LIST_HORIZONTAL_PAD);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [dotIndex, setDotIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const featured = courses.slice(0, 3);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (featured.length <= 1) return;
    timerRef.current = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % featured.length;
      setDotIndex(indexRef.current);
      scrollRef.current?.scrollTo({ x: indexRef.current * pageWidth, animated: true });
    }, AUTO_MS);
  }, [clearTimer, featured.length, pageWidth]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  useEffect(() => {
    indexRef.current = 0;
    setDotIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [pageWidth]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.min(
        featured.length - 1,
        Math.max(0, Math.round(x / pageWidth))
      );
      indexRef.current = idx;
      setDotIndex(idx);
      startTimer();
    },
    [startTimer, featured.length, pageWidth]
  );

  const onScrollBeginDrag = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  if (featured.length === 0) return null;

  const cardW = Math.max(1, pageWidth - 16);

  return (
    <View className="mb-4">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        decelerationRate="fast"
        accessibilityLabel="Featured courses"
      >
        {featured.map((course) => (
          <Pressable
            key={course.id}
            onPress={() => router.push(`/(app)/course/${course.id}`)}
            style={{ width: pageWidth }}
            className="items-center"
            accessibilityRole="button"
            accessibilityLabel={`Featured: ${course.title}`}
          >
            <View className="rounded-2xl overflow-hidden bg-neutral-900" style={{ width: cardW, height: 160 }}>
              <Image
                source={{ uri: course.thumbnail }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
              />
              <View className="absolute inset-0 bg-black/35" />
              <View className="absolute bottom-0 left-0 right-0 p-3">
                <View className="self-start bg-primary-600/90 px-2 py-0.5 rounded-full mb-1">
                  <Text className="text-white text-xs font-semibold">{course.category}</Text>
                </View>
                <Text className="text-white text-base font-bold" numberOfLines={2}>
                  {course.title}
                </Text>
                <Text className="text-white/80 text-xs mt-0.5" numberOfLines={1}>
                  {course.instructor?.name ?? 'Instructor'}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {featured.length > 1 ? (
        <View className="flex-row justify-center mt-2 gap-1.5">
          {featured.map((c, i) => (
            <View
              key={c.id}
              className={`h-1.5 rounded-full ${i === dotIndex ? 'w-4 bg-primary-600' : 'w-1.5 bg-neutral-300 dark:bg-neutral-600'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const FeaturedBanner = memo(FeaturedBannerComponent);
