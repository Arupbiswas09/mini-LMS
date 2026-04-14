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

  it('returns unchanged list when only one candidate', async () => {
    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [makeCourse('only', ['react'], 4.5, 200)];

    const result = await rankRelatedCourses(current, candidates);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('only');
  });
});

// ─── fetchAiRanking branch coverage ──────────────────────────────────────────
// These tests load the module fresh with Supabase env vars configured so the
// SUPABASE_URL / SUPABASE_ANON_KEY constants evaluate to a non-empty string,
// exercising the remote-AI code path inside fetchAiRanking.
describe('aiRecommendationService – remote AI configured', () => {
  const originalFetch = global.fetch;

  // Use jest.isolateModules so the module re-evaluates with the env vars set.
  // The isolated module instance is captured in `mod` and used in each test.
  // The rest of the test suite is unaffected because isolateModules restores
  // the registry after the synchronous callback completes.
  function loadIsolatedModule() {
    let mod!: typeof import('@/services/aiRecommendationService');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@/services/aiRecommendationService');
    });
    return mod;
  }

  beforeEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('calls fetch and returns AI-ranked order when remote AI succeeds', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [
      makeCourse('a', ['react'], 4.1, 300),
      makeCourse('b', ['node'], 4.9, 500),
    ];

    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rankedIds: ['b', 'a'] }),
    } as unknown as Response);
    global.fetch = mockFetch;

    const result = await mod.rankRelatedCourses(current, candidates);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result[0]?.id).toBe('b');
    expect(result[1]?.id).toBe('a');
  });

  it('caches AI result and does not call fetch on second identical request', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [makeCourse('a', ['react'], 4.1, 300), makeCourse('b', ['node'], 4.9, 500)];

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rankedIds: ['b', 'a'] }),
    } as unknown as Response);
    global.fetch = mockFetch;

    await mod.rankRelatedCourses(current, candidates);
    await mod.rankRelatedCourses(current, candidates);

    // Fetch should only be called once; second call is served from cache.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to local ranking when fetch returns non-ok response', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react', 'typescript'], 4.0, 100);
    const candidates = [
      makeCourse('a', ['react', 'typescript'], 4.5, 300),
      makeCourse('b', ['python'], 3.8, 500),
    ];

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    const result = await mod.rankRelatedCourses(current, candidates);

    // Local ranking puts the tag-matching course first.
    expect(result[0]?.id).toBe('a');
  });

  it('falls back to local ranking when fetch returns empty rankedIds array', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [makeCourse('a', ['react'], 4.8, 300), makeCourse('b', ['node'], 4.1, 500)];

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rankedIds: [] }),
    } as unknown as Response);

    const result = await mod.rankRelatedCourses(current, candidates);

    // Local ranking: tag-match 'a' comes first.
    expect(result[0]?.id).toBe('a');
  });

  it('falls back to local ranking when fetch payload has no rankedIds field', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [makeCourse('a', ['react'], 4.1, 300), makeCourse('b', ['node'], 4.9, 500)];

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ unexpectedField: 'oops' }),
    } as unknown as Response);

    const result = await mod.rankRelatedCourses(current, candidates);

    expect(result).toHaveLength(2);
  });

  it('falls back to local ranking when fetch throws a network error', async () => {
    const mod = loadIsolatedModule();
    mod.__resetAiRecommendationCacheForTests();

    const current = makeCourse('current', ['react'], 4.0, 100);
    const candidates = [makeCourse('a', ['react'], 4.1, 300), makeCourse('b', ['node'], 4.9, 500)];

    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network error'));

    const result = await mod.rankRelatedCourses(current, candidates);

    expect(result).toHaveLength(2);
  });
});
