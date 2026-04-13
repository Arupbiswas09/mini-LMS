# Deploy and Test `ai-recommend`

## 1) Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

## 2) Authenticate CLI (safe, non-interactive)

```bash
export SUPABASE_ACCESS_TOKEN="<your_supabase_personal_access_token>"
```

## 3) Link project

```bash
cd lms-app
supabase link --project-ref hogdzzjkmoluvuzxnreh
```

## 4) Set function secrets

```bash
supabase secrets set OPENAI_API_KEY="<your_openai_api_key>" --project-ref hogdzzjkmoluvuzxnreh
supabase secrets set OPENAI_MODEL="gpt-4.1-mini" --project-ref hogdzzjkmoluvuzxnreh
supabase secrets set OPENAI_BASE_URL="https://ai.atconglobal.com/v1" --project-ref hogdzzjkmoluvuzxnreh
```

## 5) Deploy function

```bash
supabase functions deploy ai-recommend --project-ref hogdzzjkmoluvuzxnreh
```

## 6) Validate function response

```bash
curl -sS "https://hogdzzjkmoluvuzxnreh.supabase.co/functions/v1/ai-recommend" \
  -H "Content-Type: application/json" \
  -H "apikey: <your_supabase_anon_or_publishable_key>" \
  -H "Authorization: Bearer <your_supabase_anon_or_publishable_key>" \
  -d '{
    "courseId":"42",
    "category":"Development",
    "tags":["react","typescript"],
    "candidateIds":["101","102","103"]
  }'
```

Expected success JSON:

```json
{
  "rankedIds": ["102", "101", "103"],
  "source": "ai",
  "model": "gpt-4.1-mini"
}
```

Fallback JSON (if OpenAI key missing or API fails):

```json
{
  "rankedIds": ["101", "103", "102"],
  "source": "fallback"
}
```
