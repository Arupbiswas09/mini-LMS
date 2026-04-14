import { useQuery } from '@tanstack/react-query';
import { queryKeys, queryClient } from '@/lib/queryClient';
import { courseService } from '@/services/courseService';
import type { CourseWithInstructor, PaginatedData } from '@/types';

async function resolveCourseWithInstructor(id: string): Promise<CourseWithInstructor> {
  const infiniteData = queryClient.getQueryData<{
    pages: Array<PaginatedData<CourseWithInstructor>>;
  }>(queryKeys.courses.infinite());

  if (infiniteData) {
    for (const page of infiniteData.pages) {
      const found = page.data.find((c) => c.id === id);
      if (found) return found;
    }
  }

  const course = await courseService.getCourseById(id);
  const instructors = await courseService.getInstructors(1, 10);
  const list = instructors.data;
  const instructor = list[Number(course.id) % list.length] ?? list[0];
  if (!instructor) {
    throw new Error('No instructors available');
  }
  return { ...course, instructor };
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.courses.detail(id) : (['courses', 'detail', 'none'] as const),
    queryFn: () => resolveCourseWithInstructor(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
