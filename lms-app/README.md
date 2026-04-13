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
```

> `EXPO_PUBLIC_SENTRY_DSN` is optional — app works without it, errors just won't be reported to Sentry.

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
```

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
