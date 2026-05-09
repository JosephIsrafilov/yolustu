# Yolüstü — Azerbaijan Carpooling Prototype

Yolüstü is a Sprint 0 frontend-only prototype for a carpooling product in Azerbaijan. It is built to demonstrate passenger, driver, and admin flows with mock data before Sprint 1 backend integration.

This repository is not production-ready. It does not include a real backend, real authentication, payments, maps, SMS, push notifications, chat, or uploads.

## Current Sprint 0 Status

- Next.js 16 App Router + TypeScript frontend prototype.
- Tailwind CSS v4 for styling.
- Zustand for client-side state.
- Mock demo data and mock flows only.
- P0 protected route guards exist for passenger, driver, and admin screens.
- P0 mock store validation exists for booking, review, and trip-related actions.
- P0 mobile UI improvements exist for landing, search, trip list, trip details, driver dashboard, and admin dashboard.
- Data is in-memory/client-side mock state. It is suitable for demos only.
- Real backend/API integration is planned for Sprint 1 and is not implemented yet.

## Technology Stack

| Area | Current implementation |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Data | Mock data / client-side state |
| Authentication | Mock login only |
| Backend | Not implemented |

## What Is Not Implemented Yet

- Real backend or database.
- Real auth/JWT/session handling.
- Real password verification.
- Payments.
- Maps/GPS.
- SMS OTP.
- Push notifications.
- Chat.
- File upload.
- Production moderation, verification, or audit tooling.

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

## Demo Users

Sprint 0 uses mock login. The email must match an existing demo user, blocked users cannot log in, and the password is intentionally accepted as "any password" for demo purposes.

| Role | Email | Password |
|---|---|---|
| Driver | elvin@example.com | any password |
| Passenger | aysel@example.com | any password |
| Driver | murad@example.com | any password |
| Admin | sanan@example.com | any password |

## Mock Flows

These flows are clickable mock flows, not real backend workflows:

- Passenger registration/login.
- Profile setup.
- Ride search.
- Trip list and trip details.
- Booking request creation.
- Passenger booking list.
- Driver booking request review.
- Driver trip creation.
- Driver trip list/dashboard.
- Review creation.
- Admin dashboard.
- Admin users, trips, and bookings management.
- Passenger/driver role switching where supported by the prototype.

## Important Business Rules In The Mock Store

The Sprint 0 Zustand store includes P0 validation so the clickable prototype behaves more safely:

- Unknown or blocked users cannot log in.
- Protected pages require a mock current user.
- Driver pages require driver capability/role.
- Admin pages require admin role.
- Users cannot book their own trips.
- Bookings require an active existing trip and available seats.
- Duplicate active bookings are prevented.
- Booking acceptance validates trip seats and booking status.
- Cancelling an accepted booking restores seats.
- Reviews validate author, target, rating range, duplicate reviews, and completed-trip constraints where supported by mock data.
- Deleting a trip avoids leaving related mock state in an unsafe orphaned state.

These are frontend mock validations only. They must be reimplemented and enforced server-side in Sprint 1.

## Project Structure

```text
yolustu/
├── docs/
│   ├── sprint-0-report.md
│   ├── product-vision.md
│   ├── mvp-scope.md
│   ├── scrum-roles.md
│   ├── product-backlog.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   ├── architecture.md
│   ├── api-contract.md
│   ├── database-schema.md
│   ├── demo-scenario.md
│   └── risks-and-metrics.md
├── src/
│   ├── app/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── trips/
│   │   ├── bookings/
│   │   ├── driver/
│   │   ├── reviews/
│   │   └── admin/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── store/
│   └── types/
├── package.json
├── next.config.ts
└── tsconfig.json
```

## Implemented Screens

- `/` — landing/onboarding prototype.
- `/auth/register` — mock registration.
- `/auth/login` — mock login.
- `/profile/setup` — protected profile setup.
- `/profile` — profile screen.
- `/search` — ride search.
- `/trips` — trip results.
- `/trips/[id]` — trip details and booking request UI.
- `/bookings` — passenger bookings.
- `/bookings/requests` — driver booking requests.
- `/driver` — driver dashboard.
- `/driver/create-trip` — mock create trip flow.
- `/driver/my-trips` — driver trips.
- `/reviews/create` — mock review flow.
- `/admin` — admin dashboard.
- `/admin/users` — admin users.
- `/admin/trips` — admin trips.
- `/admin/bookings` — admin bookings.

## Sprint 1 Direction

Sprint 1 should replace mock-only behavior with server-backed functionality:

1. Backend project setup.
2. Database schema implementation.
3. User/profile APIs.
4. Real authentication and JWT/session handling.
5. Server-side validation for bookings, trips, reviews, and admin actions.
6. API integration from the Next.js frontend.
7. Error handling, loading states, and test coverage.

## License

MIT
