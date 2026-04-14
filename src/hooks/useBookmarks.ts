import { useMemo, useCallback } from 'react';
import { useCourseStore } from '@/stores/courseStore';
import { useInfiniteCourses } from '@/hooks/useCourses';
import type { CourseWithInstructor } from '@/types';

export function useBookmarks() {
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const { data } = useInfiniteCourses();

  const bookmarkedIds = useMemo(() => Array.from(bookmarks), [bookmarks]);

  const bookmarkedCourses = useMemo(() => {
    if (!data) return [] as CourseWithInstructor[];
    const all = data.pages.flatMap((p) => p.data);
    const map = new Map(all.map((c) => [c.id, c]));
    return bookmarkedIds.map((id) => map.get(id)).filter((c): c is CourseWithInstructor => c !== undefined);
  }, [bookmarkedIds, data]);

  return { bookmarkedIds, bookmarkedCourses };
}

export function useToggleBookmark() {
  const toggleBookmark = useCourseStore((s) => s.toggleBookmark);
  return useCallback(
    (courseId: string) => {
      toggleBookmark(courseId);
    },
    [toggleBookmark]
  );
}
