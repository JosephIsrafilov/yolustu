# Sprint 0 Report — Yolüstü

## Sprint Metadata

| Field | Value |
|---|---|
| Sprint | Sprint 0 |
| Scope | Frontend-only clickable prototype |
| Stack | Next.js 16 App Router, TypeScript, Tailwind CSS v4, Zustand |
| Data | Mock data / client-side state |
| Backend | Not implemented |
| Production readiness | Not production-ready |

## Sprint Goal

Sprint 0 establishes a working frontend prototype for Yolüstü, a carpooling platform concept for Azerbaijan. The goal is to validate navigation, screen coverage, passenger/driver/admin flows, and mock business rules before Sprint 1 backend integration.

## Current Implementation

### Implemented

- Next.js 16 + TypeScript frontend prototype.
- Mobile-first screens for onboarding, auth, profile, search, trips, bookings, driver flows, reviews, and admin flows.
- Tailwind CSS v4 styling.
- Zustand state management.
- Mock users, trips, bookings, reviews, vehicles, and related demo data.
- Mock login with existing-user lookup.
- Blocked mock users cannot log in.
- Protected route guards for auth-only, driver-only, and admin-only pages.
- Store-level validation for key mock booking, review, and trip actions.
- P0 mobile UI improvements for landing, search, trip list, trip details, driver dashboard, and admin dashboard.

### Not Implemented

- Real backend.
- Real database.
- Real auth/JWT/session handling.
- Real password verification.
- Payments.
- Maps/GPS.
- SMS OTP.
- Push notifications.
- Chat.
- File upload.
- Production admin moderation.
- Production security controls.

## Demo Authentication

Sprint 0 authentication is intentionally mock-only:

- The user must exist by email.
- Blocked users are rejected.
- Password is intentionally "any password" for Sprint 0 demo use.
- No JWT, cookies, sessions, refresh tokens, or backend calls exist.

Demo users:

| Role | Email | Password |
|---|---|---|
| Driver | elvin@example.com | any password |
| Passenger | aysel@example.com | any password |
| Driver | murad@example.com | any password |
| Admin | sanan@example.com | any password |

## Mock Data And State

The prototype uses Zustand and local mock data. Passenger, driver, and admin flows mutate client-side state for demonstration. This is not a substitute for backend validation.

P0 validation currently exists for:

- Login user lookup and blocked-user handling.
- Protected page access.
- Preventing unauthenticated bookings.
- Preventing booking your own trip.
- Preventing bookings for inactive or missing trips.
- Preventing bookings when seats are unavailable.
- Preventing duplicate active bookings.
- Validating booking seat count.
- Validating booking acceptance.
- Restoring seats when an accepted booking is cancelled.
- Validating review author, target, rating range, duplicates, and completed-trip constraints where supported by mock data.
- Avoiding unsafe orphaned mock state when trips are deleted.

All of this must be enforced again on the server in Sprint 1.

## Implemented Routes

| Route | Status |
|---|---|
| `/` | Implemented |
| `/auth/register` | Implemented mock flow |
| `/auth/login` | Implemented mock flow |
| `/profile/setup` | Implemented, protected |
| `/profile` | Implemented |
| `/search` | Implemented |
| `/trips` | Implemented |
| `/trips/[id]` | Implemented |
| `/bookings` | Implemented, protected |
| `/bookings/requests` | Implemented, driver protected |
| `/driver` | Implemented, driver protected |
| `/driver/create-trip` | Implemented, driver protected |
| `/driver/my-trips` | Implemented, driver protected |
| `/reviews/create` | Implemented, protected |
| `/admin` | Implemented, admin protected |
| `/admin/users` | Implemented, admin protected |
| `/admin/trips` | Implemented, admin protected |
| `/admin/bookings` | Implemented, admin protected |

## How To Run

```bash
npm install
npm run dev
npm run build
npm run lint
```

Development server:

```text
http://localhost:3000
```

## Sprint Review Notes

### What Is Ready For Demo

- The prototype can be used to click through major passenger, driver, and admin journeys.
- Mock validation is strong enough for a safer Sprint 0 demo.
- Mobile UI has been tightened on the main discovery and booking screens.
- Documentation now clearly separates current implementation from future backend/API plans.

### Known Gaps

- No real persistence beyond client-side mock state.
- No real authentication or authorization.
- No server-side business rules.
- No production API integration.
- No payment, map, SMS, push, chat, or upload implementation.
- Test coverage is still limited/not established as a full suite.
- Accessibility and responsive polish need deeper review.

## Sprint 1 Preparation

Recommended next work:

1. Choose and scaffold the backend.
2. Implement database models and migrations.
3. Implement real auth/JWT/session flows.
4. Move all critical business validation to the backend.
5. Connect frontend flows to real APIs.
6. Add test coverage for auth, bookings, trips, reviews, and admin actions.
7. Add production-grade error/loading states.

Sprint 0 should remain a frontend prototype until those Sprint 1 backend foundations exist.
