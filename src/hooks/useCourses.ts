import { useCallback, useRef } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { courseService } from '@/services/courseService';
import type { CourseWithInstructor, PaginatedData } from '@/types';

const PAGE_SIZE = 10;

export function useInfiniteCourses() {
  return useInfiniteQuery<PaginatedData<CourseWithInstructor>, Error>({
    queryKey: queryKeys.courses.infinite(),
    queryFn: ({ pageParam }) => courseService.getCoursesWithInstructors(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNextPage) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCatalogScrollPrefetch(
  fetchNextPage: () => Promise<unknown>,
  hasNextPage: boolean,
  isFetchingNextPage: boolean
) {
  const lastAt = useRef(0);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      if (contentSize.height <= 0) return;
      const scrolledRatio = (contentOffset.y + layoutMeasurement.height) / contentSize.height;
      if (scrolledRatio < 0.8 || !hasNextPage || isFetchingNextPage) return;
      const now = Date.now();
      if (now - lastAt.current < 700) return;
      lastAt.current = now;
      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );
}
