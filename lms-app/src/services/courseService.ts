import { get } from '@/lib/api/client';
import { mapProductToCourse, mapUserToInstructor, searchCourses } from '@/utils/courseMapper';
import type { ApiResponse, Course, CourseWithInstructor, Instructor, PaginatedData, RandomProduct, RandomUser } from '@/types';

const INSTRUCTOR_CACHE_TTL_MS = 10 * 60 * 1000;

type InstructorsCache = {
  expiresAt: number;
  byLimit: Map<number, Instructor[]>;
};

const instructorsCache: InstructorsCache = {
  expiresAt: 0,
  byLimit: new Map<number, Instructor[]>(),
};

const FALLBACK_INSTRUCTOR: Instructor = {
  id: 'mini-lms-team',
  name: 'Mini LMS Team',
  avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400',
  bio: 'Course support team',
  specialty: 'Learning Experience',
  email: 'support@mini-lms.app',
  location: 'Global',
  courseCount: 0,
};

function readInstructorCache(limit: number): Instructor[] {
  if (Date.now() > instructorsCache.expiresAt) {
    instructorsCache.byLimit.clear();
    return [];
  }
  return instructorsCache.byLimit.get(limit) ?? [];
}

function writeInstructorCache(limit: number, instructors: Instructor[]): void {
  instructorsCache.byLimit.set(limit, instructors);
  instructorsCache.expiresAt = Date.now() + INSTRUCTOR_CACHE_TTL_MS;
}

async function getCachedInstructors(limit: number): Promise<Instructor[]> {
  const cached = readInstructorCache(limit);
  if (cached.length > 0) return cached;

  const fetched = await courseService.getInstructors(1, limit);
  if (fetched.data.length > 0) {
    writeInstructorCache(limit, fetched.data);
    return fetched.data;
  }

  return [];
}

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
    const coursesData = await courseService.getCourses(page, limit);

    let instructors: Instructor[] = [];
    try {
      // Reuse cached instructors across pages to cut API calls and latency.
      instructors = await getCachedInstructors(limit);
    } catch {
      const cached = readInstructorCache(limit);
      instructors = cached.length > 0 ? cached : [FALLBACK_INSTRUCTOR];
    }

    if (instructors.length === 0) {
      instructors = [FALLBACK_INSTRUCTOR];
    }

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

export function __resetCourseServiceCacheForTests(): void {
  instructorsCache.byLimit.clear();
  instructorsCache.expiresAt = 0;
}
