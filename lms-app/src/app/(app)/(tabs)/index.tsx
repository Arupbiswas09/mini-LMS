import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn } from 'react-native-reanimated';
import { useInfiniteCourses, useCatalogScrollPrefetch } from '@/hooks/useCourses';
import { useDebounce } from '@/hooks/useDebounce';
import { useCourseStore } from '@/stores/courseStore';
import { queryClient, queryKeys } from '@/lib/queryClient';
import { courseService } from '@/services/courseService';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { CourseCard } from '@/components/course/CourseCard';
import { FeaturedBanner } from '@/components/course/FeaturedBanner';
import { CategoryPill } from '@/components/ui/CategoryPill';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { searchCourses } from '@/utils/courseMapper';
import type { CourseWithInstructor } from '@/types';
import type { CourseFilter } from '@/stores/courseStore';

const CATEGORIES: CourseFilter[] = [
  'All',
  'Development',
  'Design',
  'Business',
  'Technology',
  'Arts',
  'Health & Fitness',
];

export default function CoursesCatalogScreen() {
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchBarHeight = useSharedValue(0);
  const endReachedLock = useRef(false);
  const searchInputRef = useRef<TextInput>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } =
    useInfiniteCourses();

  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  const isBookmarked = useCourseStore((s) => s.isBookmarked);
  const activeFilter = useCourseStore((s) => s.activeFilter);
  const setFilter = useCourseStore((s) => s.setFilter);
  const isDarkMode = usePreferencesStore((s) => s.isDarkMode);
  const bookmarks = useCourseStore((s) => s.bookmarks);

  const allCourses = useMemo<CourseWithInstructor[]>(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  const filteredCourses = useMemo(() => {
    let result = allCourses;
    if (activeFilter !== 'All') {
      result = result.filter((c) => c.category === activeFilter);
    }
    if (debouncedSearch) {
      result = searchCourses(debouncedSearch, result) as CourseWithInstructor[];
    }
    return result;
  }, [allCourses, activeFilter, debouncedSearch]);

  const isFilterFallback = useMemo(
    () =>
      allCourses.length > 0 &&
      activeFilter !== 'All' &&
      !debouncedSearch.trim() &&
      filteredCourses.length === 0,
    [allCourses.length, activeFilter, debouncedSearch, filteredCourses.length]
  );

  const visibleCourses = useMemo(
    () => (isFilterFallback ? allCourses : filteredCourses),
    [isFilterFallback, allCourses, filteredCourses]
  );

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    overflow: 'hidden',
    opacity: searchBarHeight.value > 0 ? 1 : 0,
  }));

  const closeSearchBar = useCallback(() => {
    Keyboard.dismiss();
    setSearchVisible(false);
    searchBarHeight.value = withTiming(0, { duration: 250 });
    setSearchInput('');
  }, [searchBarHeight]);

  const openSearchBar = useCallback(() => {
    setSearchVisible(true);
    searchBarHeight.value = withTiming(56, { duration: 250 });
  }, [searchBarHeight]);

  const handleToggleSearch = useCallback(() => {
    if (searchVisible) closeSearchBar();
    else openSearchBar();
  }, [searchVisible, closeSearchBar, openSearchBar]);

  useEffect(() => {
    if (!searchVisible) return;
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [searchVisible]);

  const clearCatalogFilters = useCallback(() => {
    setFilter('All');
    setSearchInput('');
    closeSearchBar();
  }, [setFilter, closeSearchBar]);

  const handleCoursePress = useCallback(
    (course: CourseWithInstructor) => {
      router.push(`/(app)/course/${course.id}`);
    },
    [router]
  );

  // Prefetch detail data on long-press so the detail screen loads instantly.
  const handleCourseLongPress = useCallback(
    (course: CourseWithInstructor) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.courses.detail(course.id),
        queryFn: () => courseService.getCourseById(course.id),
        staleTime: 5 * 60 * 1000,
      });
    },
    []
  );

  const handleBookmark = useCallback(
    (courseId: string) => {
      toggleBookmark(courseId);
    },
    [toggleBookmark]
  );

  const handleOpenNotifications = useCallback(() => {
    router.push('/(app)/(tabs)/profile');
  }, [router]);

  const handleOpenBookmarks = useCallback(() => {
    router.push('/(app)/(tabs)/bookmarks');
  }, [router]);

  const onEndReached = useCallback(() => {
    if (endReachedLock.current || !hasNextPage || isFetchingNextPage) return;
    endReachedLock.current = true;
    void fetchNextPage().finally(() => {
      setTimeout(() => {
        endReachedLock.current = false;
      }, 900);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onScrollPrefetch = useCatalogScrollPrefetch(fetchNextPage, !!hasNextPage, isFetchingNextPage);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<CourseWithInstructor>) => (
      <CourseCard
        course={item}
        onPress={handleCoursePress}
        onLongPress={handleCourseLongPress}
        onBookmark={handleBookmark}
        isBookmarked={isBookmarked(item.id)}
        highlightQuery={debouncedSearch}
      />
    ),
    [handleCoursePress, handleCourseLongPress, handleBookmark, isBookmarked, debouncedSearch]
  );

  // Stable item type: all items are the same card layout
  const getItemType = useCallback(() => 'course-card', []);

  const keyExtractor = useCallback((item: CourseWithInstructor) => item.id, []);

  const ListHeader = useCallback(
    () => (
      <View className="pb-2">
        <View className="flex-row items-center justify-between px-1 mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Discover Courses</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {allCourses.length} courses available
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleOpenNotifications}
              className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mr-2"
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              accessibilityHint="Opens profile to manage notification settings"
            >
              <Ionicons name="notifications-outline" size={20} color={isDarkMode ? '#f3f4f6' : '#374151'} />
            </TouchableOpacity>
            <View className="relative mr-2">
              <TouchableOpacity
                onPress={handleOpenBookmarks}
                className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
                accessibilityRole="button"
                accessibilityLabel={`Bookmarks, ${bookmarks.size} saved`}
                accessibilityHint="Opens your bookmarked courses"
              >
                <Ionicons name="bookmark-outline" size={20} color={isDarkMode ? '#f3f4f6' : '#374151'} />
              </TouchableOpacity>
              {bookmarks.size > 0 ? (
                <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-error-500 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {bookmarks.size > 9 ? '9+' : bookmarks.size}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={handleToggleSearch}
              className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
              accessibilityRole="button"
              accessibilityLabel={searchVisible ? 'Close search' : 'Open search'}
            >
              <Ionicons
                name={searchVisible ? 'close' : 'search'}
                size={20}
                color={isDarkMode ? '#f3f4f6' : '#374151'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={searchAnimatedStyle} className="px-1 pb-2">
          <TextInput
            ref={searchInputRef}
            className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-base text-neutral-900 dark:text-white"
            placeholder="Search courses..."
            placeholderTextColor="#9ca3af"
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            accessibilityLabel="Search courses"
          />
        </Animated.View>

        <FeaturedBanner courses={allCourses} />

        <View className="mt-2 mb-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            {CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                isSelected={activeFilter === cat}
                onPress={() => setFilter(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {isFilterFallback ? (
          <View className="mx-1 mt-2 rounded-xl bg-warning-100 dark:bg-amber-900/30 px-3 py-2">
            <Text className="text-xs font-medium text-amber-800 dark:text-amber-200">
              No {activeFilter} courses in current API response. Showing all courses.
            </Text>
          </View>
        ) : null}
      </View>
    ),
    [
      allCourses,
      activeFilter,
      bookmarks.size,
      handleOpenBookmarks,
      handleOpenNotifications,
      handleToggleSearch,
      isDarkMode,
      searchAnimatedStyle,
      searchInput,
      searchVisible,
      setFilter,
      isFilterFallback,
    ]
  );

  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View className="items-center py-6">
          <ActivityIndicator color="#2563eb" />
        </View>
      );
    }
    if (!hasNextPage && visibleCourses.length > 0) {
      return (
        <Text className="text-center text-neutral-400 dark:text-neutral-600 py-6 text-sm">
          No more courses to load
        </Text>
      );
    }
    return <View className="h-4" />;
  }, [isFetchingNextPage, hasNextPage, visibleCourses.length]);

  const ListEmpty = useCallback(
    () => {
      const filteredEmpty = allCourses.length > 0;
      return (
        <Animated.View
          entering={FadeIn}
          className="items-center justify-center py-20 px-6 min-h-[320] flex-1"
        >
          <Ionicons name={filteredEmpty ? 'funnel-outline' : 'search-outline'} size={48} color="#9ca3af" />
          <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 text-center">
            {filteredEmpty ? 'No matching courses' : 'No courses found'}
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-center mt-2 mb-6">
            {filteredEmpty
              ? 'Try clearing search or setting the category to All.'
              : 'Pull down to refresh, or try again in a moment.'}
          </Text>
          {filteredEmpty ? (
            <TouchableOpacity
              onPress={clearCatalogFilters}
              className="bg-primary-600 px-6 py-3 rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Clear search and category filters"
            >
              <Text className="text-white font-semibold">Clear filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-primary-600 px-6 py-3 rounded-xl"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">Refresh</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    },
    [allCourses.length, clearCatalogFilters, handleRefresh]
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
        <OfflineBanner />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-neutral-500 dark:text-neutral-400">Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900 px-6" edges={['top']}>
        <OfflineBanner />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
          <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 text-center">
            Something went wrong
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-center mt-2 mb-6">
            We couldn&apos;t load the courses. Please try again.
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-primary-600 px-6 py-3 rounded-xl"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['top']}>
      <OfflineBanner />
      <LegendList
        data={visibleCourses}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={180}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onScroll={onScrollPrefetch}
        scrollEventThrottle={16}
        getItemType={getItemType}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
            progressBackgroundColor={isDarkMode ? '#171717' : '#ffffff'}
          />
        }
        contentContainerStyle={[
          { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
          visibleCourses.length === 0 ? { flexGrow: 1 } : null,
        ]}
        recycleItems={false}
      />
    </SafeAreaView>
  );
}
