# Mini LMS

A production-grade mobile Learning Management System built with React Native Expo. Browse courses, track progress, stream content through WebView, and get personalized recommendations.

---

## Screenshots

| Login | Course Catalog | Course Detail |
|---|---|---|
| ![Login](assets/screenshots/login.png) | ![Catalog](assets/screenshots/catalog.png) | ![Detail](assets/screenshots/detail.png) |

| WebView | Profile | Dark Mode |
|---|---|---|
| ![WebView](assets/screenshots/webview.png) | ![Profile](assets/screenshots/profile.png) | ![Dark](assets/screenshots/dark.png) |

---

## Tech Stack

| Concern | Library | Why |
|---|---|---|
| Framework | Expo SDK 54 | Managed workflow, OTA updates, unified native API |
| Navigation | Expo Router v3 | File-system routing, typed routes, deep links out of the box |
| State (server) | React Query v5 | Cache, background refetch, offline-first, dedup |
| State (client) | Zustand 5 | Minimal boilerplate, SOLID slices, no provider needed |
| Persistence (sensitive) | Expo SecureStore | Keychain/Keystore backed, token never in plaintext |
| Persistence (app data) | MMKV | 10x faster than AsyncStorage, synchronous reads |
| Styling | NativeWind v4 | Tailwind DX without StyleSheet boilerplate |
| Lists | LegendList | Best-in-class RN list perf, replaces FlashList |
| HTTP | Axios + axios-retry | Interceptors, retry with exponential backoff |
| Forms | React Hook Form + Zod | Zero re-renders on keystroke, schema validation |
| Animations | Reanimated 3 | 60fps UI-thread animations |
| Images | Expo Image | Blurhash placeholder, disk cache, progressive load |
| Error Tracking | Sentry Expo | Source maps, crash grouping, breadcrumbs |

---

## Architecture

### State Ownership

```
Auth state         → authStore (Zustand + SecureStore)
Server/API data    → React Query cache (persisted to MMKV)
Bookmarks/Enroll   → courseStore (Zustand + MMKV)
User preferences   → preferencesStore (Zustand + MMKV)
UI state           → local useState (never global)
```

### Key Decisions

**Why Zustand + React Query instead of Redux?**
React Query owns all server state (courses, user profile). Zustand owns client-only state (bookmarks, preferences). Mixing the two in Redux leads to cache duplication and stale data bugs.

**Why MMKV over AsyncStorage?**
MMKV reads are synchronous, which means the preferences store can hydrate _before_ the first render — no flash of wrong theme or missing bookmarks.

**Why LegendList over FlatList/FlashList?**
FlashList has known recycling issues with mixed-height items. LegendList supports `getItemType` for mixed layouts and has better scroll performance benchmarks.

**WebView bidirectional bridge**
Rather than polling, the app uses a typed message protocol over `postMessage`/`onMessage`. Messages are discriminated unions — both native and web sides are fully typed. This prevents the classic "magic string" bugs in WebView communication.

### Engineering Tradeoffs, Risks, and Mitigations

| Decision | Tradeoff | Risk | Mitigation |
|---|---|---|---|
| React Query + Zustand split | Two state tools increase conceptual overhead | Team misuse can duplicate state and drift | Clear ownership map (server vs client state), granular selectors, query key conventions |
| Free random API data mapping | Data is inconsistent across requests | UI breakage from missing/invalid fields | Defensive mapping defaults, runtime numeric guards, fallback images |
| WebView local HTML template | Fast to iterate and portable | Bridge payload tampering if unchecked | Zod-validated message contract + URL allowlist checks |
| Token refresh in interceptor | Transparent UX when token expires | Edge-case race conditions under concurrent 401s | Shared refresh lifecycle helper + request retry gate + auth fallback clear |
| Offline queued actions | Better UX on flaky networks | Silent replay confusion | Offline sync toasts (syncing/success/failure) + query invalidation on reconnect |
| Biometric login support | Faster repeat auth | Higher sensitivity on compromised devices | Root/jailbreak risk check + biometric disable policy on compromised signal |
| Sentry in production only | Reduces local noise | Missing diagnostics in release without DSN | Bootstrap metadata + optional env-based DSN init |

---

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli` (for builds)
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio + SDK 36

### Install

```bash
git clone https://github.com/Arupbiswas09/mini-LMS.git
cd mini-LMS/lms-app
npm install
```

### Environment Variables

Create a `.env.local` file in `lms-app/`:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.freeapi.app
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_AI_FUNCTION=ai-recommend
```

> `EXPO_PUBLIC_SENTRY_DSN` is optional — app works without it, errors just won't be reported to Sentry.
>
> Supabase vars are optional. If provided, analytics events are posted to `analytics_events` via REST.
>
> `EXPO_PUBLIC_SUPABASE_AI_FUNCTION` is optional. Default is `ai-recommend` for AI recommendation ranking via Supabase Edge Functions.

### Run

```bash
# Start dev server
npx expo start

# Run directly on Android emulator
npx expo run:android

# Run on iOS simulator (Mac only)
npx expo run:ios
```

---

## Tests

```bash
npm test                # all tests
npm run test:watch      # watch mode
npm run test:coverage   # coverage report (target: >70%)
npm run e2e:smoke       # Maestro smoke flows (requires Maestro CLI)
```

### E2E Smoke Flows

- `e2e/maestro/smoke-auth-catalog.yaml` → auth + catalog/search
- `e2e/maestro/smoke-detail-webview-profile.yaml` → detail + webview + profile

Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`

---

## Build APK

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Development APK (for testing)
eas build --platform android --profile preview

# Production AAB (for Play Store)
eas build --platform android --profile production
```

The preview APK will be available as a download link after the build completes (~5 mins on EAS servers).

---

## Lint & Type Check

```bash
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

---

## Features

- **Auth**: Register, login, biometric login, auto session restore, token refresh
- **Course Catalog**: Infinite scroll (LegendList), category filter, debounced search, bookmarks
- **Course Detail**: Enroll, curriculum, share, related courses
- **WebView**: Embedded course viewer with bidirectional JS bridge (lesson complete, bookmark toggle, haptics)
- **Notifications**: Bookmark milestone (every 5), 24hr inactivity reminder
- **Offline Mode**: Cached data served from MMKV, pending actions queued and replayed
- **Dark Mode**: Instant toggle, no flash thanks to synchronous MMKV read
- **Downloads**: Course resource download with progress tracking
- **Camera**: Profile avatar capture/update

---

## Known Issues

- Token auto-refresh requires a valid `/api/v1/users/refresh-token` endpoint — freeapi.app's implementation may vary.
- Biometric on Android emulators requires enabling fingerprint in emulator settings.
- `expo-notifications` local notifications don't fire in Expo Go — need a development build or EAS build.

---

## Project Structure

```
src/
├── app/              # Expo Router file-system routes
│   ├── (auth)/       # Login, Register
│   └── (app)/        # Tabs, Course detail, WebView
├── components/
│   ├── ui/           # Pure presentational (Button, Input, Card…)
│   ├── course/       # Course-domain components
│   ├── auth/         # Auth-domain components
│   └── common/       # ErrorBoundary, ToastManager, OfflineBanner
├── hooks/            # One concern per hook
├── services/         # Repository pattern API layer
├── stores/           # Zustand slices
├── lib/
│   ├── api/          # Axios client + interceptors
│   ├── storage/      # MMKV + SecureStore abstractions
│   ├── security/     # Sanitization, JWT, biometric, jailbreak
│   ├── theme/        # Semantic color tokens
│   └── validation/   # Zod schemas
├── constants/        # Colors, spacing, API endpoints
├── types/            # Global TypeScript interfaces
└── utils/            # Pure functions (courseMapper)
```
