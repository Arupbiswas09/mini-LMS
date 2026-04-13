import { get } from '@/lib/api/client';
import { mapProductToCourse, mapUserToInstructor, searchCourses } from '@/utils/courseMapper';
import type { ApiResponse, Course, CourseWithInstructor, Instructor, PaginatedData, RandomProduct, RandomUser } from '@/types';

export const courseService = {
  async getCourses(page = 1, limit = 10): Promise<PaginatedData<Course>> {
    const response = await get<ApiResponse<PaginatedData<RandomProduct>>>('/api/v1/public/randomproducts', {
      page,
      limit,
    });

    return {
      ...response.data,
      data: response.data.data.map(mapProductToCourse),
    };
  },

  async getCourseById(id: string): Promise<Course> {
    const response = await get<ApiResponse<RandomProduct>>(`/api/v1/public/randomproducts/${id}`);
    return mapProductToCourse(response.data);
  },

  async getInstructors(page = 1, limit = 10): Promise<PaginatedData<Instructor>> {
    const response = await get<ApiResponse<PaginatedData<RandomUser>>>('/api/v1/public/randomusers', {
      page,
      limit,
    });

    return {
      ...response.data,
      data: response.data.data.map(mapUserToInstructor),
    };
  },

  async getCoursesWithInstructors(page = 1, limit = 10): Promise<PaginatedData<CourseWithInstructor>> {
    const [coursesData, instructorsData] = await Promise.all([
      courseService.getCourses(page, limit),
      courseService.getInstructors(page, limit),
    ]);

    const instructors = instructorsData.data;

    const enriched: CourseWithInstructor[] = coursesData.data.map((course, index) => ({
      ...course,
      instructor: instructors[index % instructors.length] ?? instructors[0]!,
    }));

    return {
      ...coursesData,
      data: enriched,
    };
  },

  searchCourses,
} as const;
