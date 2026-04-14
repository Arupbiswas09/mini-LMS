import type { CourseWithInstructor } from '@/types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SUPABASE_AI_FUNCTION = process.env.EXPO_PUBLIC_SUPABASE_AI_FUNCTION?.trim() || 'ai-recommend';

const AI_TIMEOUT_MS = 4500;
const AI_CACHE_TTL_MS = 15 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  rankedIds: string[];
};

const recommendationCache = new Map<string, CacheEntry>();

function makeCacheKey(course: CourseWithInstructor, candidates: CourseWithInstructor[]): string {
  const ids = candidates.map((c) => c.id).sort().join(',');
  return `${course.id}|${course.category}|${ids}`;
}

function localRank(course: CourseWithInstructor, candidates: CourseWithInstructor[]): string[] {
  const preferredTags = new Set(course.tags.map((t) => t.toLowerCase()));

  return [...candidates]
    .sort((a, b) => {
      const aTagScore = a.tags.reduce((score, tag) => score + (preferredTags.has(tag.toLowerCase()) ? 1 : 0), 0);
      const bTagScore = b.tags.reduce((score, tag) => score + (preferredTags.has(tag.toLowerCase()) ? 1 : 0), 0);

      if (bTagScore !== aTagScore) return bTagScore - aTagScore;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.enrollmentCount - a.enrollmentCount;
    })
    .map((c) => c.id);
}

async function fetchAiRanking(course: CourseWithInstructor, candidates: CourseWithInstructor[]): Promise<string[] | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${SUPABASE_AI_FUNCTION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        courseId: course.id,
        category: course.category,
        tags: course.tags,
        candidateIds: candidates.map((c) => c.id),
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { rankedIds?: string[]; data?: { rankedIds?: string[] } };
    const rankedIds = payload.rankedIds ?? payload.data?.rankedIds;
    if (!Array.isArray(rankedIds) || rankedIds.length === 0) return null;

    return rankedIds;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function rankRelatedCourses(
  course: CourseWithInstructor,
  candidates: CourseWithInstructor[],
): Promise<CourseWithInstructor[]> {
  if (candidates.length <= 1) return candidates;

  const cacheKey = makeCacheKey(course, candidates);
  const cached = recommendationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    const rankIndex = new Map(cached.rankedIds.map((id, index) => [id, index]));
    return [...candidates].sort((a, b) => (rankIndex.get(a.id) ?? 9999) - (rankIndex.get(b.id) ?? 9999));
  }

  const aiRankedIds = await fetchAiRanking(course, candidates);
  const rankedIds = aiRankedIds ?? localRank(course, candidates);

  recommendationCache.set(cacheKey, {
    rankedIds,
    expiresAt: Date.now() + AI_CACHE_TTL_MS,
  });

  const rankIndex = new Map(rankedIds.map((id, index) => [id, index]));
  return [...candidates].sort((a, b) => (rankIndex.get(a.id) ?? 9999) - (rankIndex.get(b.id) ?? 9999));
}

export function __resetAiRecommendationCacheForTests(): void {
  recommendationCache.clear();
}
