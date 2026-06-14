# Yolmates Mobile Frontend — State & Build Guide

Reference for the agent building/improving the Flutter mobile frontend. Carpooling app for Azerbaijan. Goal: **100% easy to use, modern**. Read this whole file before touching UI.

> Tone of this doc is terse on purpose. Code you write must be normal-quality, fully commented Dart matching existing style.

---

## 1. Stack (do not change without permission)

| Concern | Tool | Version |
|---|---|---|
| Framework | Flutter | SDK `^3.5.0` |
| State | `flutter_riverpod` | `^2.6.1` |
| Routing | `go_router` | `^14.6.2` |
| HTTP | `dio` | `^5.9.0` |
| Secure storage | `flutter_secure_storage` | `^9.2.2` |
| Fonts | `google_fonts` (Inter) | `^6.2.1` |
| Maps | `google_maps_flutter` | `^2.17.1` |
| Realtime | `web_socket_channel` | `^3.0.1` |
| Media | `image_picker`, `record` | latest |
| i18n | `intl` + hand-rolled `AppLocalizations` | — |
| Lints | `flutter_lints` `^5.0.0` | — |

App entry: `lib/main.dart` → `ProviderScope` → `MaterialApp.router`. **Light theme only.** No dark theme yet.

Root: `mobile/yolmates_app/`. All paths below relative to that.

---

## 2. Architecture (feature-first + Riverpod)

```
lib/
  core/
    constants.dart            # cities, spacing, radius tokens
    routes.dart               # AppRoutes + GoRouter (auth-gated redirect)
    theme.dart                # AppTheme — colors + ThemeData
    localization/             # AppLocalizations (az/en/ru), languageProvider
    network/                  # ApiClient (dio), interceptors, error mapper, token storage
    repositories/             # rides repo (api + interface)
  features/
    auth/    (data + presentation + state)   # phone OTP, profile setup, splash, onboarding
    bookings/(data + screens)
    chat/    (data + screens)
    driver/  (data + screens)                # onboarding, verify, create ride, my rides, requests, active ride, panel
    home/
    notifications/
    profile/
    reviews/
    search/
    settings/
    support/
    trips/   (data + screens)                # trip list, trip detail, ride tracking
    wallet/
  shared/
    data/        # mock_data, city_coordinates, city_routes, dto+mappers
    models/      # trip.dart, user.dart
    widgets/     # main_shell, empty_state, error_state, loading_view, app_logo, map/*
```

**Layering rule (keep it):** UI → controller (Riverpod Notifier/AsyncNotifier) → repository (interface) → `ApiClient` OR mock. UI never calls `dio` directly. Repos return domain models, not DTOs.

### Mock vs API switch
- `--dart-define=API_MODE=api` → real backend. Default `mock` (in-memory).
- `--dart-define=API_BASE_URL=...` → backend URL. Default `http://10.0.2.2:8000/api/v1` (Android emulator).
- `lib/features/auth/data/auth_mode.dart` reads it. Repo provider picks api vs mock impl.
- **Each feature must work in both modes.** Mock repo for offline UI dev, api repo for real.

---

## 3. Design System (current)

### Colors (`core/theme.dart`)
```
navy      #0F172A   primary dark / hero bg / text headings
teal      #14B8A6   PRIMARY brand / buttons / active
tealLight #5EEAD4   accents on dark
tealDark  #0D9488   pressed / price text
slate50   #F8FAFC   scaffold bg
slate100  #F1F5F9   dividers
slate200  #E2E8F0   borders
slate500  #64748B   secondary text / unselected
slate700  #334155   body text
```
Error: `Colors.red.shade600`. Status colors: orange/green/red `.shadeXX` inline.

### Type — Inter via google_fonts
- headlineLarge 32 bold navy / headlineMedium 24 bold navy
- bodyLarge 16 slate700 / bodyMedium 14 slate500
- Buttons 16 w600. AppBar title 18 w600 navy.

### Tokens (`core/constants.dart`)
- spacing: 8 / 12 / 16 / 24 / 32
- radius: 8 / 12 / 16 / 24  (buttons+inputs=12, cards=16, badges=8)

### Component defaults (theme)
- ElevatedButton: teal bg, white fg, radius12, padding 24×16, elevation 0
- Card: white, radius16, elevation 0
- Input: filled white, radius12, slate200 border, teal focus 2px

### Shared widgets (REUSE these, don't re-invent)
- `EmptyState` — icon+title+message+optional action. Use for every empty list.
- `LoadingView` — centered spinner + optional message. Use for every loading state.
- `ErrorStateView` — title+message+retry. Use for every error state.
- `MainShell` — bottom nav (5 tabs).
- `AppLogo`, `RouteMapView` / `GoogleRouteMapView`.

---

## 4. Navigation map (`core/routes.dart`)

Auth-gated via GoRouter `redirect` keyed on `AuthStatus`:
`unknown/error → /splash` · `onboarding → /onboarding` · `unauthenticated → /auth-intro` · `incompleteProfile → /profile-setup` · `authenticated → app`. Driver routes (`/driver*`) require `verificationStatus == 'approved'` else bounce to onboarding.

**Bottom nav (StatefulShellRoute, 5 branches):**
1. `/` Home
2. `/search` Search
3. `/bookings` Bookings
4. `/messages` Chat list
5. `/profile` Profile

**Secondary (full-screen push):** `/trips/:id`, `/trips-list?from&to&passengers`, `/booking/confirm/:rideId?seats`, `/bookings/:id`, `/messages/:id`, `/settings`, `/support`, `/notifications`, `/reviews`, `/wallet`.

**Driver:** `/driver` onboarding, `/driver/vehicle`, `/driver/verification`, `/driver/create-ride`, `/driver/rides` (+`/:id` active ride), `/driver/requests`, `/driver/panel`.

---

## 5. Current state — screen by screen

Legend: ✅ built & wired · 🟡 built, mock/placeholder data · 🔴 placeholder/stub · ❌ missing

| Screen | State | Notes / gaps |
|---|---|---|
| Splash | ✅ | bootstraps auth |
| Onboarding | 🟡 | exists; content quality unaudited |
| Auth intro / Phone login / OTP | 🟡 | OTP flow wired to repo (mock+api). UX polish unaudited |
| Profile setup | 🟡 | first-name/last-name/role/lang |
| **Home** | 🟡 | hero search card is **static** — `_from`/`_to` hardcoded `Bakı`/`Gəncə`, not editable. Popular routes hardcoded. Notification bell wired. |
| **Search** | 🟡 | city dropdowns + date + passengers work. Date picked but **not passed** to results query. No recent/saved searches. No swap button. |
| Trip list | ✅ | real provider, sort time/price, verified filter, map preview, select-then-tap-again pattern |
| Trip detail | 🟡 | exists; not audited here |
| Booking confirm | 🟡 | seats param wired |
| Bookings list | ✅ | AsyncNotifier, loading/error/empty/refresh, status badges |
| Booking detail | 🟡 | exists |
| Chat list / detail | 🟡 | repo + ws channel present; realtime depth unaudited |
| Notifications | 🟡 | controller exists |
| **Wallet** | 🟡 | Foundation wired: AsyncNotifier controller, mock/API repos, balance + transactions from backend. Loading/error/empty states. Mock banner only in mock mode. Top-up/payment methods gated (T3.3). |
| Reviews | 🟡 | repo + dialog exist |
| Profile | ✅ | header, menu cards, logout sheet, driver-status-aware menu |
| Settings | 🟡 | language switch likely; not audited |
| Support | 🟡 | exists |
| Driver onboarding/verify | 🟡 | gates on verificationStatus; AI-assisted verify flow on backend |
| Driver create ride | 🟡 | AI pricing repo wired |
| Driver my rides / active ride / requests / panel | 🟡 | built, mock depth unknown |

### Known concrete defects (fix these)
1. **`main_shell.dart:50`** — Home tab label uses `l10n.navSearch` ("Axtar") instead of a Home/"Ana səhifə" label. Two tabs say "Axtar". Add `navHome` to `AppLocalizations`, use it.
2. **Home search card is fake** — tapping fields does nothing; can't change cities/date/passengers. Either make it real (open pickers) or make the whole card a single CTA into `/search`. Decide, don't leave dead.
3. **Search date ignored** — `_date` selected but `_search()` omits it from query string. Pass `&date=` and consume in trip list.
4. **Wallet payment methods not implemented** — add-card/top-up buttons exist but gated (T3.3 pending). Foundation is wired: balance/transactions from repo, mock vs API mode working.
5. **i18n major screens done** — `AppLocalizations` now covers ~120 strings across 10 major screens (Home, Search, TripList, Bookings, Settings, Profile, Wallet, TripDetail, BookingDetail, DriverPanel). Full AZ/EN/RU trilingual. Remaining: driver CRUD screens, minor detail screens, date/plural formatting helpers. Not 100% yet but no longer half-done.
6. **No dark theme** — `theme.dart` only `lightTheme`. Modern apps expect dark. Add if in scope.
7. **`AppLocalizations.tr` getter returns literal `'Translated'`** — dead stub, remove.

---

## 6. Backend contract (what mobile talks to)

FastAPI under `/api/v1`. Auth = HttpOnly cookies on web, but **mobile uses Bearer tokens** (`accessToken`/`refreshToken`/`csrf_token` in JSON) stored via `AuthTokenStorage`. `ApiClient` auto-injects `Authorization` + `X-CSRF-Token`, auto-refreshes on 401 once, clears on fail.

Error envelope:
```json
{ "success": false, "error": { "code": "...", "message": "...", "timestamp": "..." } }
```
`api_error_mapper.dart` maps both this and FastAPI `detail[]` validation errors to `ApiException` with Azerbaijani messages. **Always surface `apiError.message` to user, handle 429 (rate limit) and 401 (auto-handled).**

Domains available backend-side: identity, trips, bookings, engagement (chat/reviews/notifications), payments (wallet), ai (pricing), gamification, admin. Mobile has NOT wired: full wallet/payments, gamification, most of engagement realtime. See `docs/api-contract.md` for exact endpoints before wiring any repo.

---

## 7. Design direction — make it modern & dead-easy

Principles for every new/edited screen:

1. **One primary action per screen.** Big teal button. No competing CTAs.
2. **Thumb-reachable.** Primary actions bottom-anchored on tall screens.
3. **Never a blank white screen.** Always `LoadingView` / `EmptyState` / `ErrorStateView`. No silent failure.
4. **Skeleton > spinner** for lists (add shimmer skeletons; current code uses spinners — upgrade).
5. **Optimistic + feedback.** Every tap gives instant visual response (ripple, loading, snackbar). Disabled buttons must look disabled AND say why.
6. **Az-first copy.** Real users are Azerbaijani. Short, friendly, no jargon.
7. **Consistency.** Reuse theme tokens + shared widgets. No one-off colors/paddings. If you need a value not in `constants.dart`/`theme.dart`, add it there.
8. **Motion.** Subtle page transitions, hero on avatars/cards, animated bottom-nav. Keep <300ms.
9. **Trust signals** (carpooling = strangers in cars): verified badges, ratings, trip counts, driver photo, license-plate, in-app SOS/share-trip. Surface prominently.
10. **Accessibility.** Min tap target 48×48, semantic labels, contrast ≥4.5:1. Test with TalkBack.

---

## 8. Task backlog for build agent

Ordered. Each task = verifiable. Do TDD/widget tests where logic exists. Run `flutter analyze` + `flutter test` before claiming done. Match existing file/comment style.

### Phase 0 — Fix defects (quick wins)
- [x] **T0.1** Add `navHome` ("Ana səhifə"/"Home"/"Главная") to `AppLocalizations`; fix `main_shell.dart` Home label.
- [x] **T0.2** Remove dead `AppLocalizations.tr` stub.
- [x] **T0.3** Decide Home search card: make real (editable city/date/passenger → push `/trips-list` with all params) OR convert to single CTA → `/search`. ✅ Made real, mirrors SearchScreen.
- [x] **T0.4** Pass `date` from `SearchScreen._search()` into `/trips-list` query; consume in `TripListScreen` (filter/display).
- [x] **T0.5** Add a from↔to **swap button** in Search + Home.

### Phase 1 — Design system hardening
- [x] **T1.1** Add `AppTheme.darkTheme`; wire `themeMode` provider + toggle in Settings. Persist via `SessionStorage`. ✅ ThemeMode.system default, 3-option picker (İşıqlı/Qaranlıq/Sistem).
- [x] **T1.2** Build skeleton/shimmer widget; replace `LoadingView` in list screens (bookings, trip list, chat list, notifications). ✅ Created `Shimmer`, `SkeletonBox`, `SkeletonCircle` + card-specific skeletons (`BookingCardSkeleton`, `TripCardSkeleton`, `ChatCardSkeleton`). Replaced spinners in bookings, trips, chat.
- [~] **T1.3** Extract repeated card container (white+radius16+slate200 border) into `AppCard` shared widget; refactor home/bookings/wallet/trip cards onto it. Surgical — no behavior change. ⚠️ Skipped — refactor caused file corruption, git reverted. Widget exists (`lib/shared/widgets/app_card.dart`) but unused.
- [x] **T1.4** Standardize status badge (booking/trip/verification) into one `StatusBadge` widget driven by an enum→(bg,fg,label) map. ✅ Created `StatusBadge` widget + `.colors` extensions on `BookingStatus`, `DriverRideStatus`, `RequestStatus`, `VerificationStatus`. Removed 6 duplicate `_StatusBadge` classes across bookings/driver screens.
- [x] **T1.5** Add subtle route transitions (shared axis) via go_router `pageBuilder`. ✅ Created `_buildPageWithTransition` helper with 250ms slide+fade. Applied to all secondary routes (trips, bookings, profile sub-pages, driver routes). Bottom nav tabs unchanged.

### Phase 2 — i18n decision & cleanup
- [x] **T2.1** Decision needed (ASK USER): az-only vs full az/en/ru. If trilingual → extract ALL hardcoded strings into `AppLocalizations`. If az-only → remove `languageProvider`/`LanguageNotifier`/multi-map scaffolding, keep flat constants. ✅ **Decision: FULL TRILINGUAL AZ/EN/RU.**
- [x] **T2.2** Execute chosen path across all screens. ✅ **Completed major screen localization.** ~120 trilingual entries added to `app_localizations.dart`. Localized screens: Home, Search, TripList, Bookings, Settings, BookingDetail, TripDetail, Wallet, DriverPanel, Profile. Verification: `flutter analyze` clean, all 46 tests pass. Mock/API architecture preserved.
- [ ] **T2.3** Remaining i18n cleanup: driver CRUD screens (CreateRide, AddVehicle, MyRides detail, PassengerRequests detail, ActiveRide), minor detail screens, date formatting helpers (Az month/weekday names), plural forms (1 yer / 2+ yerlər).

### Phase 3 — Wallet & payments
- [x] **T3.1** `WalletRepository` interface + api + mock impls. Wire balance + transactions from payments domain (`docs/api-contract.md`). ✅ Created domain models (WalletBalance, WalletTransaction), DTOs, MockWalletRepository (demo data), ApiWalletRepository (GET /wallet/me, GET /wallet/me/transactions).
- [x] **T3.2** Replace hardcoded `WalletScreen` data with controller (AsyncNotifier). Loading/error/empty states. ✅ WalletController with refresh/loadMore, WalletScreen wired, pull-to-refresh, mock banner only in mock mode.
- [x] **T3.3** "Add card" + "top up" flows — or, if backend not ready, gate behind a real feature flag and keep the demo banner honest (no fake balance shown as real). ✅ Actions gated with "Tezliklə/Coming soon/Скоро" badges until backend documents POST /wallet/topup and POST /wallet/payment-methods endpoints. No fake payment flows.

### Phase 4 — Trust & safety UX (carpooling-critical)
- [x] **T4.1** Driver profile card: photo, verified badge, rating, trip count, vehicle + plate. Reuse on trip list/detail/booking. ✅ Created DriverTrustCard widget (avatar/verified badge/rating/trip count, compact mode, message button). Used in TripDetailScreen.
- [x] **T4.2** Trip detail: prominent "Verified driver" / "Documents checked" trust block. ✅ Created TripTrustBlock with gradient background, verification icon, safety message.
- [x] **T4.3** Active ride: "Share trip" (live link) + "SOS"/emergency contact button. ✅ Share trip copies route/time/ID to clipboard (no fake tracking URL). SOS shows confirmation dialog with copy details + call 112 options. Safety section visible only during active rides.
- [x] **T4.4** Post-trip review prompt (auto-surface `review_dialog` on trip complete). ✅ Auto-prompts once per booking when status is completed in BookingDetailScreen. Session-only guard prevents repeat prompts. Manual review button remains for user-initiated reviews.

### Phase 5 — Core flow polish
- [ ] **T5.1** Home: real "Popular routes" from backend (or AI/trips), not hardcoded 3 cards.
- [ ] **T5.2** Search: recent searches (persist last 5 in `SessionStorage`), 1-tap re-search.
- [ ] **T5.3** Booking confirm: clear price breakdown (seat × n, platform fee, total in AZN). Backend `PLATFORM_FEE_PERCENT`.
- [ ] **T5.4** Onboarding: 3-slide value-prop carousel (save money / safe / easy), skippable, modern illustrations.
- [ ] **T5.5** Empty states everywhere get an illustration + action (not just icon).
- [ ] **T5.6** Pull-to-refresh on all list screens (bookings has it; add to chat, notifications, trip list).

### Phase 6 — Realtime & notifications
- [ ] **T6.1** Audit chat ws reconnect/typing/read-receipts; add if missing.
- [ ] **T6.2** Push notifications (FCM) — booking accepted/rejected, new message, driver arriving. (New dep — ASK before adding `firebase_messaging`.)
- [ ] **T6.3** In-app notification badge count on bottom-nav profile/chat.

### Phase 7 — QA
- [ ] **T7.1** Widget tests for controllers (auth, bookings, rides search).
- [ ] **T7.2** Golden tests for shared widgets (AppCard, StatusBadge, EmptyState).
- [ ] **T7.3** Accessibility pass (semantics, tap targets, contrast).
- [ ] **T7.4** `flutter analyze` clean (currently has `analyze.err`/`analyze.log` artifacts — investigate & zero out).

---

## 9. Rules for the build agent

- **Ask before:** adding any new dependency, az-only vs trilingual decision (T2.1), any backend contract assumption not in `docs/api-contract.md`.
- **Surgical edits.** Touch only what the task names. Don't "improve" adjacent code (per repo `CLAUDE.md`).
- **Both modes.** Every feature works in `mock` AND `api`.
- **Verify before done.** `flutter analyze` + relevant `flutter test`. Report real output.
- **Match style.** Doc comments on public classes (existing code does this — see `bookings_screen.dart`, `main_shell.dart`). Inter font, theme tokens, shared widgets.
- **No fake-as-real.** Placeholder data must be visibly labeled demo or behind a flag (wallet lesson).

---

## 10. Quick reference — run commands

```bash
# from mobile/yolmates_app/
flutter pub get
flutter analyze
flutter test

# mock mode (default, no backend)
flutter run

# real backend (android emulator)
flutter run --dart-define=API_MODE=api --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1

# real backend (ios sim)
flutter run --dart-define=API_MODE=api --dart-define=API_BASE_URL=http://localhost:8000/api/v1
```

Backend must run (`uvicorn app.main:app --reload` from `backend/`) for `api` mode.
