jest.mock('@/lib/api/client', () => ({
  get: jest.fn(),
}));

import { get } from '@/lib/api/client';
import { courseService, __resetCourseServiceCacheForTests } from '@/services/courseService';
import type { Course, Instructor, PaginatedData } from '@/types';
import type { RandomProduct, RandomUser, ApiResponse, PaginatedResponse } from '@/types';

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

  it('reuses cached instructors if a later instructor request fails', async () => {
    jest.spyOn(courseService, 'getCourses').mockResolvedValue(sampleCourses);

    const getInstructorsSpy = jest
      .spyOn(courseService, 'getInstructors')
      .mockResolvedValueOnce(sampleInstructors)
      .mockRejectedValueOnce(new Error('network failed'));

    await courseService.getCoursesWithInstructors(1, 10);
    const result = await courseService.getCoursesWithInstructors(2, 10);

    expect(getInstructorsSpy).toHaveBeenCalledTimes(1);
    expect(result.data[0]?.instructor.name).toBe('Jane Doe');
  });

  it('falls back to built-in instructor when instructor API returns no data', async () => {
    jest.spyOn(courseService, 'getCourses').mockResolvedValue(sampleCourses);
    jest.spyOn(courseService, 'getInstructors').mockResolvedValue({
      ...sampleInstructors,
      data: [],
      totalItems: 0,
    });

    const result = await courseService.getCoursesWithInstructors(1, 10);

    expect(result.data[0]?.instructor.name).toBe('Mini LMS Team');
  });

  it('uses default page and limit when called with no args', async () => {
    jest.spyOn(courseService, 'getCourses').mockResolvedValue(sampleCourses);
    jest.spyOn(courseService, 'getInstructors').mockResolvedValue(sampleInstructors);

    const result = await courseService.getCoursesWithInstructors();

    expect(result.data).toHaveLength(1);
  });

  it('fetches fresh instructors when a different limit misses the cache', async () => {
    jest.spyOn(courseService, 'getCourses').mockResolvedValue(sampleCourses);
    const getInstructorsSpy = jest
      .spyOn(courseService, 'getInstructors')
      .mockResolvedValue(sampleInstructors);

    // First call writes cache for limit=10
    await courseService.getCoursesWithInstructors(1, 10);
    // Second call: cache not expired but limit=5 key absent → byLimit.get(5) ?? [] fires
    await courseService.getCoursesWithInstructors(1, 5);

    expect(getInstructorsSpy).toHaveBeenCalledTimes(2);
  });
});

// ─── Direct implementation coverage ──────────────────────────────────────────

const mockGet = jest.mocked(get);

const sampleRandomProduct: RandomProduct = {
  id: 42,
  title: 'Electronics Course',
  price: 99.99,
  description: 'Learn electronics',
  category: 'electronics',
  image: 'https://example.com/img.jpg',
  rating: { rate: 4.3, count: 87 },
};

const sampleRandomUser: RandomUser = {
  gender: 'female',
  name: { title: 'Ms', first: 'Jane', last: 'Doe' },
  email: 'jane@gmail.com',
  picture: {
    large: 'https://example.com/large.jpg',
    medium: 'https://example.com/medium.jpg',
    thumbnail: 'https://example.com/thumb.jpg',
  },
  location: { city: 'New York', state: 'NY', country: 'USA' },
  login: { uuid: 'uuid-jane', username: 'janedoe' },
};

describe('courseService.getCourses – direct implementation', () => {
  beforeEach(() => {
    __resetCourseServiceCacheForTests();
    jest.restoreAllMocks();
    mockGet.mockReset();
  });

  it('uses default page and limit when called with no args', async () => {
    mockGet.mockResolvedValueOnce({
      statusCode: 200,
      message: 'ok',
      success: true,
      data: { data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0, hasNextPage: false, hasPrevPage: false },
    });

    await courseService.getCourses();

    expect(mockGet).toHaveBeenCalledWith('/api/v1/public/randomproducts', { page: 1, limit: 10 });
  });

  it('calls the products endpoint and maps results to Course[]', async () => {
    const apiResponse: ApiResponse<PaginatedData<RandomProduct>> = {
      statusCode: 200,
      message: 'ok',
      success: true,
      data: {
        data: [sampleRandomProduct],
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
    mockGet.mockResolvedValueOnce(apiResponse);

    const result = await courseService.getCourses(1, 10);

    expect(mockGet).toHaveBeenCalledWith('/api/v1/public/randomproducts', { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.id).toBe('42');
    expect(result.data[0]?.title).toBe('Electronics Course');
  });
});

describe('courseService.getCourseById', () => {
  beforeEach(() => {
    __resetCourseServiceCacheForTests();
    jest.restoreAllMocks();
    mockGet.mockReset();
  });

  it('calls the product detail endpoint and returns a mapped Course', async () => {
    const apiResponse: ApiResponse<RandomProduct> = {
      statusCode: 200,
      message: 'ok',
      success: true,
      data: sampleRandomProduct,
    };
    mockGet.mockResolvedValueOnce(apiResponse);

    const result = await courseService.getCourseById('42');

    expect(mockGet).toHaveBeenCalledWith('/api/v1/public/randomproducts/42');
    expect(result.id).toBe('42');
    expect(result.title).toBe('Electronics Course');
    expect(result.category).toBe('Technology');
  });

  it('propagates errors from the API client', async () => {
    mockGet.mockRejectedValueOnce(new Error('network failure'));

    await expect(courseService.getCourseById('999')).rejects.toThrow('network failure');
  });
});

describe('courseService.getInstructors – direct implementation', () => {
  beforeEach(() => {
    __resetCourseServiceCacheForTests();
    jest.restoreAllMocks();
    mockGet.mockReset();
  });

  it('uses default page and limit when called with no args', async () => {
    mockGet.mockResolvedValueOnce({
      statusCode: 200,
      message: 'ok',
      success: true,
      data: { data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0, hasNextPage: false, hasPrevPage: false },
    });

    await courseService.getInstructors();

    expect(mockGet).toHaveBeenCalledWith('/api/v1/public/randomusers', { page: 1, limit: 10 });
  });

  it('calls the randomusers endpoint and maps results to Instructor[]', async () => {
    const apiResponse: PaginatedResponse<RandomUser> = {
      statusCode: 200,
      message: 'ok',
      success: true,
      data: {
        data: [sampleRandomUser],
        page: 1,
        limit: 5,
        totalPages: 1,
        totalItems: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
    mockGet.mockResolvedValueOnce(apiResponse);

    const result = await courseService.getInstructors(1, 5);

    expect(mockGet).toHaveBeenCalledWith('/api/v1/public/randomusers', { page: 1, limit: 5 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Jane Doe');
    // Specialty is derived from email domain (gmail → Full-Stack Development)
    expect(result.data[0]?.specialty).toBe('Full-Stack Development');
  });
});
