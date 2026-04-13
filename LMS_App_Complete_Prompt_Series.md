# Mini LMS App — Complete Phase-by-Phase Prompt Series
### React Native Expo · TypeScript Strict · Production-Grade · Senior-Level

> **How to use this guide:** Feed each prompt verbatim into your AI coding assistant (Cursor, Claude, Copilot) at the start of each phase. Each prompt is self-contained and builds on the previous phase's output. Never skip a phase — the architecture compounds.

---

## Architecture Decisions (Read Before Phase 1)

| Concern | Choice | Rationale |
|---|---|---|
| Navigation | Expo Router v3 (file-system) | Type-safe routes, deep linking, layouts |
| State | Zustand + React Query v5 | Server vs client state separation (CQRS principle) |
| Persistence | MMKV (fast) + SecureStore (sensitive) | 10x faster than AsyncStorage, SecureStore for tokens |
| Styling | NativeWind v4 | Tailwind DX, no StyleSheet boilerplate |
| Lists | LegendList | FlashList replacement, best-in-class RN list perf |
| HTTP | Axios + axios-retry + react-query | Interceptors, retry, cache, dedup, background refetch |
| Forms | React Hook Form + Zod | Uncontrolled inputs = zero re-renders on keystroke |
| Animations | Reanimated 3 + Gesture Handler | UI thread animations, no JS bridge jank |
| Error tracking | Sentry Expo | Source maps, crash grouping, breadcrumbs |
| Testing | Jest + React Native Testing Library | Component-level + integration |
| Build | EAS Build + GitHub Actions | CI/CD, APK generation |

---

## PHASE 1 — Foundation, Architecture & Design System

### Prompt 1.1 — Project Scaffold

```
You are a senior React Native architect. Scaffold a production-grade Expo project with the following exact specifications. Do NOT use placeholder comments — write complete, working code for every file.

PROJECT: Mini LMS App
SDK: Expo SDK 52 (latest stable)
Language: TypeScript with strict mode (tsconfig "strict": true, "noUncheckedIndexedAccess": true)
Navigation: Expo Router v3 with typed routes
Styling: NativeWind v4 with Tailwind CSS

FOLDER STRUCTURE (enforce strictly — SOLID Single Responsibility):
src/
  app/                          ← Expo Router file-system routes
    (auth)/
      login.tsx
      register.tsx
      _layout.tsx
    (app)/
      (tabs)/
        index.tsx               ← Course catalog
        bookmarks.tsx
        profile.tsx
        _layout.tsx
      course/[id].tsx
      webview/[id].tsx
      _layout.tsx
    _layout.tsx                 ← Root layout (auth guard)
    +not-found.tsx
  components/
    ui/                         ← Pure presentational, zero business logic
    course/                     ← Course-domain components
    auth/                       ← Auth-domain components
    common/                     ← Shared primitives
  hooks/                        ← Custom hooks (one concern per hook)
  services/                     ← API layer (Repository pattern)
  stores/                       ← Zustand slices (one store per domain)
  lib/
    api/                        ← Axios instance + interceptors
    storage/                    ← MMKV + SecureStore abstractions
    validation/                 ← Zod schemas
  constants/                    ← Colors, sizes, API URLs
  types/                        ← Global TypeScript interfaces
  utils/                        ← Pure functions, no side effects

TASKS:
1. Initialize Expo with expo-router, nativewind, typescript
2. Create tsconfig.json with strict mode + path aliases (@/ → src/)
3. Create tailwind.config.js with custom design system colors/spacing
4. Create babel.config.js with NativeWind and module-resolver plugins
5. Create app.json with proper bundle identifiers, permissions, splash screen config
6. Create src/constants/theme.ts with:
   - Full color palette (primary, secondary, success, error, warning, neutral scale)
   - Typography scale (xs, sm, base, lg, xl, 2xl, 3xl) with fontWeight variants
   - Spacing scale (matching Tailwind)
   - Border radius tokens
   - Shadow tokens (iOS + Android)
7. Create src/constants/api.ts with BASE_URL = 'https://api.freeapi.app' and all endpoint paths
8. Create src/types/index.ts with:
   - User, AuthTokens, LoginCredentials, RegisterCredentials
   - Course (mapped from randomproducts), Instructor (mapped from randomusers)
   - ApiResponse<T>, PaginatedResponse<T>, ApiError
   - Bookmark, UserPreferences, AppState
9. Create root _layout.tsx with:
   - SplashScreen control
   - Font loading (Inter family via expo-font)
   - Auth state guard (redirect to /login if no token)
   - ErrorBoundary wrapping entire app
   - SafeAreaProvider, GestureHandlerRootView, QueryClientProvider
10. Install and configure all dependencies:
    expo-router, nativewind, zustand, @tanstack/react-query,
    axios, axios-retry, expo-secure-store, react-native-mmkv,
    react-hook-form, zod, @hookform/resolvers,
    react-native-reanimated, react-native-gesture-handler,
    expo-image, expo-notifications, expo-network, expo-file-system,
    @sentry/react-native, legendlist

Output every file completely. No truncation. No TODOs.
```

### Prompt 1.2 — Core Infrastructure Layer

```
Continue building the LMS app. Create the complete infrastructure layer. All code must be production-ready TypeScript with no 'any' types. Apply SOLID principles strictly.

FILE: src/lib/api/client.ts
- Create Axios instance with baseURL from constants
- Add request interceptor: attach Bearer token from SecureStore, add request ID header, log in dev mode
- Add response interceptor: extract data.data, handle 401 (clear token → navigate to login), handle network errors, normalize error shape into ApiError type
- Configure axios-retry: 3 retries, exponential backoff (1s, 2s, 4s), retry only on network errors and 5xx
- Add request timeout: 15 seconds
- Export typed get<T>, post<T>, put<T>, patch<T>, delete<T> wrapper functions

FILE: src/lib/storage/secureStorage.ts
- Wrap expo-secure-store with typed interface
- Methods: setToken(token), getToken(), setRefreshToken(t), getRefreshToken(), clearAll()
- Handle SecureStore availability (simulator fallback to AsyncStorage in dev)
- Add encryption option for extra sensitive values

FILE: src/lib/storage/appStorage.ts
- Wrap react-native-mmkv with typed interface
- Create typed store for: userPreferences, bookmarks (Set<string>), courseCache, lastSeen
- Add migration support (versioned schema)
- Export singleton instance

FILE: src/lib/validation/schemas.ts
- LoginSchema: email (valid email), password (min 8 chars)
- RegisterSchema: username (min 3), email, password, confirmPassword (must match)
- ProfileUpdateSchema: avatar optional URL, username
- SearchSchema: query string min 1 char
- Export inferred TypeScript types from each schema

FILE: src/lib/queryClient.ts
- Configure React Query QueryClient:
  - staleTime: 5 minutes
  - gcTime: 30 minutes
  - retry: 2 with exponential backoff
  - networkMode: 'offlineFirst'
  - Add global onError handler (show toast + Sentry capture)
  - Add global onSuccess logger (dev only)

FILE: src/services/authService.ts
- login(credentials): POST /api/v1/users/login → store token + refresh token
- register(credentials): POST /api/v1/users/register
- logout(): clear SecureStore + Zustand auth store + QueryClient cache
- refreshToken(): POST /api/v1/users/refresh-token → update stored tokens
- getMe(): GET /api/v1/users/current-user → returns User
- updateProfile(data): PATCH /api/v1/users/update-account
- updateAvatar(uri): PATCH /api/v1/users/avatar with FormData

FILE: src/services/courseService.ts
- getCourses(page, limit): GET /api/v1/public/randomproducts with pagination
- getCourseById(id): GET /api/v1/public/randomproducts/:id
- getInstructors(page, limit): GET /api/v1/public/randomusers
- searchCourses(query, courses[]): pure function filtering cached data
- All functions return properly typed results mapped to Course/Instructor interfaces

No placeholders. Complete, compilable code only.
```

---

## PHASE 2 — Authentication & Secure Session Management

### Prompt 2.1 — Auth Store & Session Management

```
Build the complete authentication system for the LMS app using Zustand. Follow SOLID principles — each store has a single responsibility.

FILE: src/stores/authStore.ts
- State: user (User | null), isAuthenticated, isLoading, error
- Actions:
  - login(credentials): calls authService.login, stores token, sets user
  - register(credentials): calls authService.register, auto-login after
  - logout(): calls authService.logout, resets entire store
  - restoreSession(): on app start, reads token from SecureStore, calls getMe, sets user (auto-login)
  - updateUser(partial): optimistic update of user in store
  - setError(msg) / clearError()
- Persist user preferences to MMKV (not full user object — security)
- Use immer middleware for immutable updates
- Use devtools middleware in DEV

FILE: src/hooks/useAuth.ts
- Thin wrapper over authStore
- Expose: user, isAuthenticated, isLoading, error, login, register, logout
- Add form submission handlers that integrate with React Hook Form
- Return properly typed hook interface

FILE: src/app/(auth)/_layout.tsx
- Stack navigator for auth screens
- Redirect to /(app) if already authenticated
- Apply consistent header styles

FILE: src/app/(auth)/login.tsx
REQUIREMENTS:
- Use React Hook Form + Zod resolver (LoginSchema)
- Email field: keyboard type email, autocomplete email, returnKeyType next
- Password field: secureTextEntry, toggle visibility button, returnKeyType done
- Submit button: show ActivityIndicator while loading, disabled during loading
- "Don't have an account? Register" link
- Shake animation (Reanimated 3) on failed login
- Error message displayed below form in red
- Biometric login button (expo-local-authentication) — if enrolled, show fingerprint/face icon, attempt biometric → retrieve stored credentials → login
- KeyboardAvoidingView wrapping form
- Full TypeScript, no any types

FILE: src/app/(auth)/register.tsx
REQUIREMENTS:
- Same patterns as login
- Fields: username, email, password, confirmPassword
- Real-time validation feedback (green checkmark when valid, red X when invalid)
- Password strength indicator (weak/medium/strong) with animated color bar
- Terms & conditions checkbox (required)
- "Already have account? Login" link

FILE: src/app/_layout.tsx (Root layout — update from Phase 1)
- Call authStore.restoreSession() in useEffect on mount
- Show SplashScreen until session restoration completes
- Use Slot from expo-router
- Wrap with: GestureHandlerRootView, SafeAreaProvider, QueryClientProvider, ThemeProvider

All components must use NativeWind classes only — no StyleSheet.create.
All inputs must be properly accessible (accessibilityLabel, accessibilityHint).
```

### Prompt 2.2 — Profile Screen

```
Build the complete Profile screen for the LMS app.

FILE: src/app/(app)/(tabs)/profile.tsx
REQUIREMENTS:
- Display: avatar (Expo Image with blur placeholder), username, email, joined date
- Stats section: "Courses Enrolled", "Bookmarked", "Completed" — each in a stat card with number + label
- Edit profile section:
  - Tap avatar → Image picker (expo-image-picker) → upload to API → optimistic UI update
  - Edit username form (inline edit, React Hook Form)
  - Save/cancel buttons appear only when changed
- Settings section:
  - Notifications toggle (stored in MMKV preferences)
  - Dark mode toggle (stored in preferences, applies via ThemeProvider)
  - Biometric login toggle
  - Clear cache button (with confirmation alert)
- Logout button at bottom (with confirmation alert)
- Pull-to-refresh to refetch user data
- Loading skeleton while data loads (animated shimmer effect using Reanimated 3)

FILE: src/components/ui/Avatar.tsx
- Props: uri (string | null), size (sm | md | lg | xl), initials (string)
- Show initials in colored circle when no uri
- Use Expo Image with placeholder blur and fade transition
- Accessible (accessibilityLabel)

FILE: src/components/ui/StatCard.tsx
- Props: label, value (number), icon (Ionicon name)
- Animated number count-up on mount (Reanimated 3)

FILE: src/components/ui/SkeletonLoader.tsx
- Generic skeleton with animated shimmer
- Variants: line, card, avatar, listItem
- Respects prefers-reduced-motion
```

---

## PHASE 3 — Course Catalog with Advanced List Optimization

### Prompt 3.1 — Course Store & Data Layer

```
Build the complete course catalog data layer for the LMS app.

FILE: src/stores/courseStore.ts
- State: bookmarks (Set<string>), enrolledCourses (Set<string>), searchQuery, activeFilter
- Actions:
  - toggleBookmark(courseId): toggle + persist to MMKV + trigger notification check (5+ bookmarks)
  - enrollCourse(courseId): add to enrolled set + persist
  - setSearchQuery(q)
  - setFilter(filter)
  - hydrate(): restore bookmarks and enrolled from MMKV on app start
  - isBookmarked(id): selector
  - isEnrolled(id): selector
- Never store course data here — that's React Query's job (server state separation)

FILE: src/hooks/useCourses.ts
- useInfiniteCourses(): useInfiniteQuery fetching paginated courses + instructors
  - Combine course + instructor data (zip by index, instructor teaches course)
  - Return: courses (enriched with instructor), fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch
  - Add prefetchNextPage when user reaches 80% of list

FILE: src/hooks/useCourse.ts
- useCourse(id): useQuery for single course detail
- Reads from React Query cache first (no network if already cached)
- Returns enriched Course + Instructor

FILE: src/hooks/useBookmarks.ts
- useBookmarks(): returns bookmarked course IDs + full course objects from cache
- useToggleBookmark(): mutation that updates store + schedules notification if count hits 5

FILE: src/utils/courseMapper.ts
- mapProductToCourse(product: RandomProduct): Course
  - id, title (product.name), description (product.description), price (product.price)
  - thumbnail (product.thumbnail), category, rating (product.rating.rate)
  - ratingCount (product.rating.count), duration (derived from price range)
  - difficulty (derived from category)
- mapUserToInstructor(user: RandomUser): Instructor
  - id, name (first + last), avatar (picture.large), bio (generated from location)
  - specialty (derived from email domain)
- These are pure functions — no side effects, fully testable
```

### Prompt 3.2 — Course List Screen

```
Build the Course Catalog screen with world-class performance and UI.

FILE: src/app/(app)/(tabs)/index.tsx
REQUIREMENTS:
- Header: "Discover Courses" title + notification bell icon (badge count) + search toggle
- Category filter bar: horizontal ScrollView of pill buttons (All, Development, Design, Business, etc.)
  - Selected state with animated underline (Reanimated 3 layout animation)
- LegendList implementation:
  - keyExtractor: (item) => item.id
  - renderItem: memoized with React.memo (check: component NEVER re-renders unless its course changes)
  - estimatedItemSize: 180
  - onEndReached: fetchNextPage (throttled — not called twice)
  - onEndReachedThreshold: 0.3
  - ListHeaderComponent: featured course banner + category filter
  - ListFooterComponent: loading spinner or "No more courses" text
  - ListEmptyComponent: empty state illustration + "No courses found" + retry button
  - refreshControl: RefreshControl with pull-to-refresh
- Search: animated search bar slides in from top (Reanimated layout animation)
  - Debounced input (300ms) using useDebounce hook
  - Filters in-memory from cached courses — NO new API call for search
  - Highlighted search term in results

FILE: src/components/course/CourseCard.tsx
REQUIREMENTS:
- Props: course (Course), onPress, onBookmark, isBookmarked
- Layout: thumbnail (16:9 Expo Image), badge (category), title (2 lines max), instructor row (avatar + name), rating stars, price, bookmark icon
- Bookmark icon: animated heart scale on toggle (Reanimated spring)
- Press: scale down animation on press (0.97 scale, spring back)
- Skeleton variant: pass isLoading=true to show shimmer instead
- Fully memoized with React.memo — equality check on id + isBookmarked only
- NativeWind styling exclusively

FILE: src/components/course/FeaturedBanner.tsx
- Horizontal auto-scrolling banner of top 3 courses
- Pagination dots
- Auto-scroll every 4 seconds (reset on manual swipe)

FILE: src/components/ui/RatingStars.tsx
- Props: rating (0-5), size, showCount
- Half-star support
- Accessible

FILE: src/components/ui/CategoryPill.tsx
- Props: label, isSelected, onPress
- Animated selected state

FILE: src/hooks/useDebounce.ts
- Generic typed debounce hook

FILE: src/hooks/useNetworkStatus.ts
- Wraps expo-network useNetworkState
- Returns: isConnected, isInternetReachable, connectionType
- Triggers offline banner when disconnected
```

### Prompt 3.3 — Course Detail Screen

```
Build the Course Detail screen for the LMS app.

FILE: src/app/(app)/course/[id].tsx
REQUIREMENTS:
- Read id from useLocalSearchParams — type-safe
- Hero section:
  - Full-width thumbnail (Expo Image with blur placeholder)
  - Floating back button (absolute positioned, semi-transparent)
  - Gradient overlay on image for text readability
- Course info:
  - Title (large, bold), category badge, rating row, enrollment count
  - Instructor card: tap → (future) instructor profile
  - Description (expandable — show more/less with animation)
  - Course stats: duration, difficulty, lessons count, language
  - Curriculum section: mock lesson list (generated from course data)
- Action area (sticky bottom bar):
  - Enroll button: if not enrolled → "Enroll Now" (primary button) → animate to "Enrolled ✓"
  - Open in WebView button: navigate to /webview/[id]
  - Bookmark button in top-right corner (animated)
- Share button in header → expo-sharing with course deep link
- Related courses horizontal scroll at bottom (React Query prefetched)

FILE: src/components/course/EnrollButton.tsx
- Animated state transition: idle → loading → enrolled
- Uses Reanimated 3 for smooth icon swap animation
- Haptic feedback on enroll (expo-haptics)

FILE: src/components/course/CurriculumList.tsx
- Props: courseId
- Generates mock curriculum from course data (deterministic from id)
- Shows: section headers + lesson rows with duration + lock icon for unenrolled
```

---

## PHASE 4 — WebView Integration with Bidirectional JS Bridge

### Prompt 4.1 — WebView Screen & Bridge

```
Build the WebView integration for course content viewing. This must be a showcase of advanced WebView communication.

FILE: src/app/(app)/webview/[id].tsx
REQUIREMENTS:
- Read course data from React Query cache (no extra API call)
- WebView from expo that loads a local HTML template
- Inject course data via injectedJavaScript on load (not postMessage — faster)
- Implement full bidirectional bridge:
  NATIVE → WEB:
  - On load: inject course object, user enrollment status, theme (dark/light), user name
  - On theme change: postMessage({ type: 'THEME_CHANGE', payload: { isDark } })
  - On enrollment change: postMessage({ type: 'ENROLLMENT_UPDATE', payload: { isEnrolled } })
  WEB → NATIVE (onMessage handler):
  - { type: 'LESSON_COMPLETE', payload: { lessonId } } → update progress in store
  - { type: 'SHARE_COURSE' } → trigger native share sheet
  - { type: 'BOOKMARK_TOGGLE' } → toggle bookmark in store
  - { type: 'OPEN_LINK', payload: { url } } → open in system browser (expo-web-browser)
  - { type: 'HAPTIC', payload: { type } } → trigger haptic feedback
- Loading state: show native skeleton while WebView loads
- Error handling: onError + onHttpError → show native error UI with retry button
- Navigation interception: block external navigations (whitelist only)
- Custom headers on request: Authorization: Bearer {token}, X-App-Version, X-Platform
- Pull-to-reload gesture
- Progress bar at top (animated from WebView onLoadProgress)

FILE: src/lib/webview/htmlTemplate.ts
- Returns complete HTML string (not a URL — embedded in app)
- Full responsive HTML/CSS that renders course content beautifully
- Dark mode support via CSS variables (injected from native)
- Sections: hero, instructor, curriculum, about, progress tracker
- Smooth CSS animations for section entrance
- JavaScript bridge receiver code (window.ReactNativeWebView.postMessage wrapper)
- Message dispatch functions: completLesson(), toggleBookmark(), shareCourse()
- A beautiful, polished design — NOT a basic page

FILE: src/hooks/useWebViewBridge.ts
- Manages all WebView ref interactions
- injectTheme(isDark): posts theme message
- injectEnrollmentStatus(isEnrolled): posts status
- handleMessage(event): parses and routes all incoming messages
- Returns: webViewRef, onMessage handler, injection functions

FILE: src/components/webview/WebViewProgressBar.tsx
- Animated progress bar from 0 to 100%
- Hides when fully loaded
- Reanimated 3 width animation

FILE: src/components/webview/WebViewError.tsx
- Props: error, onRetry
- Shows appropriate error message based on error type
- Retry button with loading state
```

---

## PHASE 5 — Native Features

### Prompt 5.1 — Push Notifications System

```
Build the complete notifications system for the LMS app.

FILE: src/services/notificationService.ts
REQUIREMENTS:
- requestPermissions(): request push notification permissions, store result in MMKV
- scheduleBookmarkMilestone(count): when bookmarks reach 5 (and every 5 after), schedule local notification:
  "🎉 You've bookmarked {count} courses! Time to start learning?"
  - Check if already scheduled (idempotent)
  - Cancel previous if rescheduled
- scheduleInactivityReminder(): schedule a notification 24 hours from last app open
  - Store lastOpenedAt in MMKV on every app foreground
  - Cancel and reschedule on each foreground event
  - Notification: "📚 Your courses miss you! Pick up where you left off."
- cancelInactivityReminder(): call on app foreground (they opened it)
- handleNotificationResponse(response): route notification tap to correct screen
- getPermissionStatus(): returns current permission status

FILE: src/hooks/useNotifications.ts
- Setup notification handlers in useEffect
- Notifications.addNotificationReceivedListener (foreground)
- Notifications.addNotificationResponseReceivedListener (tap from background)
- Route taps to correct screen via expo-router
- Cleanup listeners on unmount
- Call in root _layout.tsx

FILE: src/app/_layout.tsx (update)
- Import useNotifications hook
- Register on launch
- Handle notification deep links
```

### Prompt 5.2 — Download, Network Monitoring & Camera

```
Build remaining native features.

FILE: src/services/downloadService.ts
- downloadCourseResource(url, filename): uses expo-file-system FileSystem.downloadAsync
- Track download progress (0-100%) via callback
- Store download state in MMKV (completed, path, size)
- getDownloadedFiles(): list all downloaded course resources
- deleteDownload(filename)
- isDownloaded(filename): boolean check

FILE: src/hooks/useFileDownload.ts
- useFileDownload(url, filename): returns { download, progress, isDownloading, isCompleted, cancel }
- Animated progress display
- Uses downloadService

FILE: src/components/common/OfflineBanner.tsx
- Subscribes to useNetworkStatus
- Animated slide-down banner when offline (Reanimated 3 entering/exiting animations)
- "You're offline — showing cached content" message
- Auto-dismiss with animation when reconnected
- Must not shift layout (absolute positioned)

FILE: src/hooks/useAppState.ts
- Tracks AppState (active/background/inactive)
- On foreground: cancel inactivity reminder, refresh data, update lastOpenedAt
- On background: schedule inactivity reminder

FILE: src/services/cameraService.ts
- pickImageFromLibrary(): expo-image-picker, returns base64 + uri
- pickImageFromCamera(): camera capture
- compressImage(uri): resize to max 800px, quality 0.8
- Used by profile avatar update
```

---

## PHASE 6 — State Management Architecture & Performance

### Prompt 6.1 — Global State Architecture

```
Finalize the complete state management architecture. Apply SOLID Interface Segregation — no God stores.

FILE: src/stores/index.ts
- Export all store selectors with shallow equality (prevent unnecessary re-renders)
- Create typed useAppStore() that composes slices
- Document the state ownership map:
  Auth state → authStore (Zustand)
  Server/API data → React Query cache
  Bookmarks/Enrollment → courseStore (Zustand, persisted MMKV)
  User preferences → preferencesStore (Zustand, persisted MMKV)
  UI state → local useState (not global)

FILE: src/stores/preferencesStore.ts
- State: isDarkMode, notificationsEnabled, biometricEnabled, language, fontSize
- All persisted to MMKV
- Hydrates synchronously from MMKV on store creation (MMKV is sync!)

FILE: src/providers/AppProviders.tsx
- Compose all providers cleanly:
  GestureHandlerRootView → SafeAreaProvider → ThemeProvider → QueryClientProvider → Children
- ThemeProvider reads from preferencesStore
- Expose useTheme hook

FILE: src/lib/queryClient.ts (update)
- Add query key factory: queryKeys.courses.list(page), queryKeys.courses.detail(id), queryKeys.user.me()
- Type-safe query keys using const assertion
- Add persistQueryClient with MMKV (offline-first cache)
  - Serialize React Query cache to MMKV on change
  - Restore cache on app start (instant data, then refetch in background)

PERFORMANCE REQUIREMENTS (document each decision):
1. LegendList: estimatedItemSize matches actual, getItemType for mixed layouts
2. All expensive computations wrapped in useMemo with documented dependency rationale
3. All callbacks wrapped in useCallback — explain which components receive them
4. Images: Expo Image with blurhash placeholder, caching: 'force-cache' for thumbnails
5. Avoid anonymous functions in JSX (all handlers defined outside render)
6. Navigation: preload course detail data on card long-press (React Query prefetch)
7. Zustand selectors: always use granular selectors, never select entire store
```

---

## PHASE 7 — Error Handling, Security & Offline Mode

### Prompt 7.1 — Error Boundaries & Network Resilience

```
Build the complete error handling and security layer. Zero unhandled errors allowed.

FILE: src/components/common/ErrorBoundary.tsx
- Class component ErrorBoundary (React error boundaries must be class components)
- Catch render errors, log to Sentry
- Show fallback UI: error illustration, message, "Retry" + "Go Home" buttons
- Reset state on route change (using key prop or resetKeys)
- Wrap each major screen route with its own ErrorBoundary

FILE: src/components/common/QueryErrorBoundary.tsx
- Wraps React Query's useErrorBoundary integration
- Specific fallback for API errors (shows HTTP status, user-friendly message)
- Retry button calls refetch

FILE: src/hooks/useRetry.ts
- Generic retry hook with exponential backoff
- Props: fn, maxRetries (default 3), baseDelay (default 1000ms)
- Returns: { execute, isRetrying, retryCount, error }

FILE: src/lib/api/errorHandler.ts
- normalizeError(axiosError): ApiError
  - Network error (no response): offline error type
  - 400: validation error, extract field errors
  - 401: auth error → trigger logout flow
  - 403: permission error
  - 404: not found
  - 429: rate limit, parse Retry-After header
  - 5xx: server error
- getUserFriendlyMessage(apiError): string — human readable, no tech jargon

FILE: src/components/common/ToastManager.tsx
- Global toast notification system (no external library — build it)
- Position: top of screen, respects safe area
- Types: success, error, warning, info
- Auto-dismiss: 3 seconds (error: 5 seconds)
- Stack multiple toasts
- Accessible: live region announcement
- Reanimated 3 slide-in from top + fade out

FILE: src/lib/security/index.ts
- sanitizeInput(str): strip XSS vectors from any user input before API calls
- validateUrl(url): whitelist check before WebView navigation
- isTokenExpired(token): parse JWT exp claim without library
- maskSensitiveData(data): redact email/password from logs
- SECURITY HEADERS: document what headers are added to every request and why

FILE: src/hooks/useOfflineMode.ts
- isOffline: boolean from expo-network
- offlineData: returns cached React Query data even when offline
- pendingActions: queue actions taken offline (bookmark, enroll) → replay when online
- replayPendingActions(): called on reconnect

Apply these in every screen:
- Wrap with ErrorBoundary
- Handle loading (skeleton), error (error component), empty (empty state) — never show blank screen
- Offline: show cached data + offline banner
```

### Prompt 7.2 — Security Hardening

```
Implement security hardening for production.

FILE: src/lib/security/certificate.ts
- Document SSL pinning approach (expo-dev-client + native config)
- Implement in app.json/plugins configuration
- Provide the native module configuration for both iOS and Android

FILE: src/lib/security/jailbreakDetection.ts
- Check for jailbreak/root indicators using available JS APIs
- Return risk level: safe | suspicious | compromised
- If compromised: warn user + optional feature restriction

FILE: src/lib/api/client.ts (update)
- Add certificate pinning configuration
- Add request signing (HMAC if API supports)
- Rotate correlation IDs per session
- Never log request body in production (Sentry breadcrumb scrubbing)

FILE: src/lib/security/biometric.ts
- enrollBiometric(): prompt user, store encrypted credentials in SecureStore with biometric flag
- authenticateWithBiometric(): LocalAuthentication.authenticateAsync → retrieve credentials
- isBiometricAvailable(): check hardware support + enrollment
- removeBiometricCredentials()

Update app.json:
- Add all required permissions with usage descriptions (iOS NSFaceIDUsageDescription, etc.)
- Configure expo-notifications channels for Android
- Set android.package and ios.bundleIdentifier
```

---

## PHASE 8 — UI/UX Polish, Design System & Accessibility

### Prompt 8.1 — Design System Components

```
Build the complete UI component library. Every component must be accessible, animated, and polished.

DESIGN PRINCIPLES:
- Consistent 8px grid (all spacing multiples of 8)
- 60fps animations (all on UI thread via Reanimated 3)
- Haptic feedback on interactive actions
- Reduced motion: respect prefers-reduced-motion
- Dark mode: every component handles both modes via NativeWind dark: variant
- Accessibility: every interactive element has accessibilityRole, accessibilityLabel, accessibilityState

FILE: src/components/ui/Button.tsx
- Variants: primary, secondary, ghost, danger, success
- Sizes: sm, md, lg
- States: default, loading (spinner), disabled, pressed (scale animation)
- Icons: optional left/right icon
- Full-width option
- Haptic: medium impact on press

FILE: src/components/ui/Input.tsx
- Label above, error message below (animated height transition)
- Left/right icons
- Clearable
- States: default, focused (border color transition), error, disabled
- All RHF-compatible (forwardRef)

FILE: src/components/ui/Card.tsx
- Variants: elevated (shadow), outlined, ghost
- Pressable variant with scale animation

FILE: src/components/ui/Badge.tsx
- Colors: primary, success, warning, error, neutral
- Sizes: sm, md

FILE: src/components/ui/ProgressBar.tsx
- Animated fill from left (Reanimated 3 withSpring)
- Color variants
- Label (percentage or custom)

FILE: src/components/ui/Modal.tsx
- Bottom sheet style (not full-screen — more native feeling)
- Backdrop blur (iOS) or dim (Android)
- Gesture to dismiss (drag down)
- Keyboard aware

FILE: src/components/common/EmptyState.tsx
- Props: illustration (SVG name), title, description, actionLabel, onAction
- Animated entrance (Reanimated FadeIn)

FILE: src/components/navigation/TabBar.tsx
- Custom tab bar replacing default Expo tabs
- Animated active indicator (sliding pill under icons)
- Badge support for notifications
- Haptic on tab switch

SCREENS — apply polish:
- Add entrance animations to all screens (Reanimated entering/exiting)
- Add shared element transitions for course card → detail (if Expo SDK supports)
- Header animations: collapse on scroll, expand on scroll-to-top
- Implement landscape orientation layouts for tablets
- Test with 1.5x and 2x font scale (dynamic type)
```

### Prompt 8.2 — Dark Mode & Theming

```
Implement complete dark mode and theming system.

FILE: src/lib/theme/index.ts
- Full color tokens for light and dark mode
- All colors from design system with semantic naming
- Export useColors() hook that returns correct set based on current mode
- Export useTheme() with isDark, toggleTheme, colors, typography, spacing

FILE: src/app/_layout.tsx (update)
- Read isDarkMode from preferencesStore (MMKV — sync, no flash)
- Apply to StatusBar (dark/light content)
- Apply colorScheme to React Navigation
- Apply to NativeWind via colorScheme prop

Audit every component for dark mode:
- Replace any hardcoded colors with theme tokens
- Verify shadows work in dark mode (lighter shadows on dark)
- Verify all text meets WCAG AA contrast ratio in both modes

FILE: src/hooks/useColorScheme.ts
- Returns current color scheme
- Includes system preference detection
- Respects user override from preferences store
```

---

## PHASE 9 — Testing, CI/CD, Build & Documentation

### Prompt 9.1 — Testing Suite

```
Write the complete test suite for the LMS app. Target >70% coverage.

FILE: src/__tests__/utils/courseMapper.test.ts
- Test mapProductToCourse with valid product
- Test mapProductToCourse with null/undefined fields (edge cases)
- Test mapUserToInstructor
- Test searchCourses filtering logic
- All pure functions → 100% coverage

FILE: src/__tests__/lib/storage/secureStorage.test.ts
- Mock expo-secure-store
- Test setToken, getToken, clearAll
- Test error handling when SecureStore unavailable

FILE: src/__tests__/lib/api/errorHandler.test.ts
- Test each error case (401, 403, 404, 429, 5xx, network)
- Test getUserFriendlyMessage for each type
- Mock axios errors

FILE: src/__tests__/stores/authStore.test.ts
- Test login action (success + failure)
- Test logout (clears state)
- Test restoreSession with valid/expired token
- Mock authService

FILE: src/__tests__/stores/courseStore.test.ts
- Test toggleBookmark (add + remove)
- Test notification trigger at 5 bookmarks
- Test MMKV persistence
- Test hydrate restores bookmarks

FILE: src/__tests__/components/CourseCard.test.tsx
- Render test (snapshot)
- Test bookmark button tap calls onBookmark
- Test press calls onPress
- Test isBookmarked = true shows correct icon
- Test loading skeleton renders

FILE: src/__tests__/components/Button.test.tsx
- Test all variants render
- Test disabled state blocks press
- Test loading state shows spinner
- Test accessibility attributes

FILE: src/__tests__/hooks/useDebounce.test.ts
- Test debounce delays correctly
- Test value updates after delay
- Test cleanup on unmount

FILE: jest.config.js
- Configure for Expo + TypeScript
- Module name mapper for @ alias
- Coverage thresholds: lines 70%, branches 65%, functions 70%
- Mock: expo-secure-store, react-native-mmkv, expo-notifications, expo-network

FILE: src/__tests__/setup.ts
- Global mocks for all native modules
- Mock Animated (prevent timer issues)
- Mock expo-router (useLocalSearchParams, router)
```

### Prompt 9.2 — CI/CD, Build & Documentation

```
Set up CI/CD pipeline and create production documentation.

FILE: .github/workflows/ci.yml
PIPELINE:
  on: push (all branches), pull_request (main)
  jobs:
    lint:
      - ESLint with @typescript-eslint/recommended
      - Prettier check
    type-check:
      - tsc --noEmit
    test:
      - Jest with coverage report
      - Upload coverage to Codecov
    build-check:
      - expo export (verify no build errors)
  on: push to main only:
    eas-build:
      - EAS Build Android APK (preview profile)
      - Upload APK as GitHub Release artifact

FILE: eas.json
- preview profile: Android APK, debug signing
- production profile: Android AAB + iOS IPA, release signing

FILE: .eslintrc.js
- @typescript-eslint/recommended
- react-hooks/recommended
- Rules: no-any, no-unused-vars, prefer-const, no-console (warn)

FILE: .prettierrc
- Standard config for React Native

FILE: README.md (complete, professional)
# Mini LMS App

## Overview
Brief description of the app and its capabilities.

## Screenshots
[Placeholder paths for: Login, Course Catalog, Course Detail, WebView, Profile, Dark Mode]

## Tech Stack
Full table of technologies with reasons for each choice.

## Architecture Decisions
- State management approach (why Zustand + React Query)
- Navigation (why Expo Router)
- Performance (LegendList, MMKV, React Query persistence)
- Security (SecureStore, biometric, certificate pinning)

## Setup Instructions
### Prerequisites
- Node.js 18+
- Expo CLI
- EAS CLI (for builds)
- Android Studio or Xcode

### Installation
\`\`\`bash
git clone <repo>
cd lms-app
npm install
npx expo start
\`\`\`

### Environment Variables
\`\`\`
EXPO_PUBLIC_API_BASE_URL=https://api.freeapi.app
EXPO_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
EXPO_PUBLIC_OPENAI_KEY=<optional>
\`\`\`

## Running Tests
\`\`\`bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
\`\`\`

## Building APK
\`\`\`bash
eas build --platform android --profile preview
\`\`\`

## Known Issues / Limitations
- List any known issues honestly
- Note any API limitations from freeapi.app

## SOLID Principles Applied
Document how each SOLID principle is applied in the codebase with file references.

## Performance Optimizations
Document each optimization and the rationale.
```

---

## BONUS PHASE — AI Course Recommendations (OpenAI SDK)

### Prompt B.1 — AI-Powered Smart Features

```
Add AI-powered features using OpenAI SDK to elevate the LMS app above all competitors.

FILE: src/services/aiService.ts
- Client: OpenAI SDK (openai npm package), key from env
- getSmartRecommendations(user: User, bookmarkedCourses: Course[], allCourses: Course[]): 
  - Build prompt: user's bookmarked course categories, titles → ask for top 5 recommendations from allCourses
  - Return: Course[] (subset of allCourses, ranked by AI relevance)
  - Cache result in MMKV for 1 hour (avoid redundant API calls)
  - Stream response for perceived performance
- generateCourseInsight(course: Course): string
  - "Why this course matters in today's job market"
  - Short (2-3 sentences), actionable
  - Cache per course ID
- smartSearch(query: string, courses: Course[]): Course[]
  - Semantic search — not just keyword match
  - Send query + course titles to GPT → return relevance-ranked IDs
  - Fallback to local keyword search if API fails (error resilience)

FILE: src/components/course/AIRecommendations.tsx
- "Recommended for You" section in Course Catalog
- Shows AI-suggested courses
- Loading: skeleton + "AI is thinking..." text
- Animated entrance when results arrive
- "Why recommended?" tooltip on each card (from insight)

FILE: src/components/course/SmartSearchBar.tsx
- Extends regular search with AI semantic mode toggle
- Switch between fast local search and AI-powered search
- Debounced AI calls (1000ms — more expensive)
- Shows "Powered by AI" badge when in AI mode
```

---

## Cross-Cutting Concerns Checklist

Apply these to EVERY screen and component:

### Performance
- [ ] No anonymous functions in JSX
- [ ] All list items wrapped in React.memo
- [ ] useCallback for all handlers passed as props
- [ ] useMemo for expensive derivations
- [ ] Expo Image everywhere (not Image from RN)
- [ ] Lazy load off-screen content

### Accessibility
- [ ] accessibilityRole on all interactive elements
- [ ] accessibilityLabel on all icons and images
- [ ] accessibilityState for toggles and selections
- [ ] Minimum touch target 44x44px
- [ ] Color is never the only way to convey information
- [ ] VoiceOver/TalkBack tested

### Error Handling
- [ ] Every screen wrapped in ErrorBoundary
- [ ] Every async operation has loading + error + success state
- [ ] Network errors show cached data + offline banner
- [ ] Forms show validation errors inline
- [ ] Retry available for every failed request

### Security
- [ ] No secrets in JS bundle
- [ ] All user inputs sanitized
- [ ] WebView whitelist enforced
- [ ] Tokens only in SecureStore
- [ ] No PII in logs or Sentry

### TypeScript
- [ ] No `any` anywhere
- [ ] All API responses typed
- [ ] All component props typed with interfaces
- [ ] Zod validation at every API boundary
- [ ] Strict null checks handled

---

## Demo Script (for 3-5 min video)

1. **Cold start** (0:00–0:30): App launches, SplashScreen → auto-login (biometric) → home screen
2. **Course Catalog** (0:30–1:30): Scroll list, pull-to-refresh, search (local + AI), filter by category, bookmark 5+ courses → notification pops
3. **Course Detail** (1:30–2:30): Tap card → detail screen, enroll, open in WebView, interact with WebView (complete lesson → native store updates)
4. **Offline Mode** (2:30–3:30): Toggle airplane mode → offline banner → cached data still shows → re-enable → data refreshes
5. **Profile** (3:30–4:30): Change avatar, toggle dark mode (instant), view stats
6. **Dark Mode** (4:30–5:00): Quick dark/light toggle showcasing consistent theming

---

*Generated for React Native Expo Mini LMS Assignment · SOLID Principles · Senior Level · v1.0*
