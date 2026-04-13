jest.mock('@/lib/api/client', () => ({
  get: jest.fn(),
}));

import { courseService, __resetCourseServiceCacheForTests } from '@/services/courseService';
import type { Course, Instructor, PaginatedData } from '@/types';

describe('courseService.getCoursesWithInstructors', () => {
  const sampleCourses: PaginatedData<Course> = {
    data: [
      {
        id: '1',
        title: 'Course 1',
        description: 'desc',
        price: 99,
        thumbnail: 'https://example.com/1.jpg',
        category: 'Development',
        rating: 4.5,
        ratingCount: 10,
        duration: 120,
        difficulty: 'Beginner',
        instructorId: 'i1',
        lessonsCount: 8,
        language: 'English',
        enrollmentCount: 100,
        tags: ['dev'],
      },
    ],
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const sampleInstructors: PaginatedData<Instructor> = {
    data: [
      {
        id: 'inst-1',
        name: 'Jane Doe',
        avatar: 'https://example.com/a.jpg',
        bio: 'bio',
        specialty: 'Frontend',
        email: 'jane@example.com',
        location: 'NY',
        courseCount: 3,
      },
    ],
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  beforeEach(() => {
    __resetCourseServiceCacheForTests();
    jest.restoreAllMocks();
  });

  it('reuses cached instructors across pages', async () => {
    const getCoursesSpy = jest
      .spyOn(courseService, 'getCourses')
      .mockResolvedValue(sampleCourses);

    const getInstructorsSpy = jest
      .spyOn(courseService, 'getInstructors')
      .mockResolvedValue(sampleInstructors);

    await courseService.getCoursesWithInstructors(1, 10);
    await courseService.getCoursesWithInstructors(2, 10);

    expect(getCoursesSpy).toHaveBeenCalledTimes(2);
    expect(getInstructorsSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to built-in instructor when instructor call fails', async () => {
    jest.spyOn(courseService, 'getCourses').mockResolvedValue(sampleCourses);
    jest.spyOn(courseService, 'getInstructors').mockRejectedValue(new Error('network failed'));

    const result = await courseService.getCoursesWithInstructors(1, 10);

    expect(result.data[0]?.instructor.name).toBe('Mini LMS Team');
  });
});
