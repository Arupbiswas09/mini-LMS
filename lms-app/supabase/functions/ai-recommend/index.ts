type RecommendRequest = {
  courseId: string;
  category?: string;
  tags?: string[];
  candidateIds: string[];
};

type RecommendResponse = {
  rankedIds: string[];
  source: 'ai' | 'fallback';
  model?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function safeJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function fallbackRank(candidateIds: string[], tags: string[]): string[] {
  const tagHash = tags.join('|').toLowerCase();
  return [...candidateIds].sort((a, b) => {
    const aScore = a.toLowerCase().split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const bScore = b.toLowerCase().split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const salt = tagHash.length || 7;
    return (aScore % salt) - (bScore % salt);
  });
}

function parseRequest(body: unknown): RecommendRequest | null {
  if (!body || typeof body !== 'object') return null;

  const data = body as Record<string, unknown>;
  const courseId = typeof data.courseId === 'string' ? data.courseId.trim() : '';
  const category = typeof data.category === 'string' ? data.category.trim() : undefined;
  const tags = Array.isArray(data.tags) ? data.tags.filter((v): v is string => typeof v === 'string') : [];
  const candidateIds = Array.isArray(data.candidateIds)
    ? data.candidateIds.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];

  if (!courseId || candidateIds.length === 0) return null;

  return { courseId, category, tags, candidateIds };
}

async function aiRank(
  openAiKey: string,
  openAiBaseUrl: string,
  model: string,
  request: RecommendRequest,
): Promise<string[] | null> {
  const prompt = [
    'Rank candidate course ids by relevance for the current course.',
    'Return JSON only: {"rankedIds": ["id1", "id2"]}.',
    'Do not include ids not present in candidateIds.',
    `courseId: ${request.courseId}`,
    `category: ${request.category ?? ''}`,
    `tags: ${request.tags?.join(',') ?? ''}`,
    `candidateIds: ${request.candidateIds.join(',')}`,
  ].join('\n');

  const normalizedBaseUrl = openAiBaseUrl.replace(/\/$/, '');

  const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const parsed = safeJson<{ rankedIds?: unknown }>(payload.choices?.[0]?.message?.content ?? '');
  if (!parsed || !Array.isArray(parsed.rankedIds)) return null;

  const allowed = new Set(request.candidateIds);
  const unique: string[] = [];

  for (const id of parsed.rankedIds) {
    if (typeof id !== 'string') continue;
    if (!allowed.has(id)) continue;
    if (!unique.includes(id)) unique.push(id);
  }

  for (const id of request.candidateIds) {
    if (!unique.includes(id)) unique.push(id);
  }

  return unique;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => null);
  const data = parseRequest(body);

  if (!data) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const openAiKey = Deno.env.get('OPENAI_API_KEY')?.trim() ?? '';
  const openAiBaseUrl = Deno.env.get('OPENAI_BASE_URL')?.trim() || 'https://api.openai.com/v1';
  const model = Deno.env.get('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';

  if (!openAiKey) {
    const rankedIds = fallbackRank(data.candidateIds, data.tags ?? []);
    const fallback: RecommendResponse = { rankedIds, source: 'fallback' };
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rankedIds = await aiRank(openAiKey, openAiBaseUrl, model, data);
  if (!rankedIds) {
    const fallback = fallbackRank(data.candidateIds, data.tags ?? []);
    const response: RecommendResponse = { rankedIds: fallback, source: 'fallback' };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ok: RecommendResponse = { rankedIds, source: 'ai', model };
  return new Response(JSON.stringify(ok), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
