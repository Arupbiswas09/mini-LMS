import { rankRelatedCourses, __resetAiRecommendationCacheForTests } from '@/services/aiRecommendationService';
import type { CourseWithInstructor } from '@/types';

function makeCourse(id: string, tags: string[], rating: number, enrollmentCount: number): CourseWithInstructor {
  return {
    id,
    title: `Course ${id}`,
    description: 'desc',
    price: 49,
    thumbnail: 'https://example.com/t.jpg',
    category: 'Development',
    rating,
    ratingCount: 100,
    duration: 10,
    difficulty: 'Beginner',
    instructorId: 'inst',
    lessonsCount: 5,
    language: 'English',
    enrollmentCount,
    tags,
    instructor: {
      id: 'inst',
      name: 'Jane',
      avatar: 'https://example.com/a.jpg',
      bio: 'bio',
      specialty: 'Frontend',
      email: 'jane@example.com',
      location: 'NY',
      courseCount: 1,
    },
  };
}

describe('aiRecommendationService', () => {
  beforeEach(() => {
    __resetAiRecommendationCacheForTests();
  });

  it('uses local ranking when remote AI is unavailable', async () => {
    const current = makeCourse('current', ['react', 'typescript'], 4.6, 1200);
    const candidates = [
      makeCourse('a', ['react'], 4.1, 300),
      makeCourse('b', ['node'], 4.9, 5000),
      makeCourse('c', ['react', 'typescript'], 4.5, 600),
    ];

    const ranked = await rankRelatedCourses(current, candidates);

    expect(ranked[0]?.id).toBe('c');
    expect(ranked[1]?.id).toBe('a');
  });

  it('returns quickly from cache for same recommendation request', async () => {
    const current = makeCourse('current', ['react'], 4.6, 1200);
    const candidates = [makeCourse('a', ['react'], 4.1, 300), makeCourse('b', ['node'], 4.9, 5000)];

    const first = await rankRelatedCourses(current, candidates);
    const second = await rankRelatedCourses(current, candidates);

    expect(second.map((c) => c.id)).toEqual(first.map((c) => c.id));
  });
});
