# Service Layer

This directory contains a service abstraction between UI/store and data sources.

## Why This Exists

- Prepare the frontend for real backend integration without rewriting every page.
- Keep UI code independent from transport details (mock vs API).
- Standardize error handling through `ApiError`.

## Current Mode

- `NEXT_PUBLIC_DATA_MODE=mock` is the default.
- In mock mode, services call thin wrappers around existing Zustand mock logic.
- In api mode, services call backend endpoints via `apiClient`.

## Environment

- `NEXT_PUBLIC_API_URL` - base URL for future backend API.
- `NEXT_PUBLIC_WS_URL` - WebSocket base URL for realtime endpoints.
- `NEXT_PUBLIC_DATA_MODE` - `mock` or `api` (default fallback is `mock`).

Switch examples:

```bash
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_DATA_MODE=api
```

Important:
- `api` mode requires a running backend at `NEXT_PUBLIC_API_URL`.
- Without backend, network calls in api mode will fail with `ApiError`.

Recommended local `.env.local` for Sprint 1:

```bash
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Recommended local `.env.local` for Sprint 2:

```bash
NEXT_PUBLIC_DATA_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Sprint 2 API-mode flows covered:
- driver create trip: `POST /rides/`
- trip list/search/details: `GET /rides/search`, `GET /rides/:id`
- passenger booking create/list/cancel: `POST /bookings`, `GET /bookings/my`, `POST /bookings/:id/cancel`
- driver request list/confirm/reject: `GET /bookings/requests`, `POST /bookings/:id/confirm`, `POST /bookings/:id/reject`

Seat rules expected by UI:
- `pending` booking does not consume seats
- `accepted` consumes seats
- reject does not consume seats
- cancel accepted/paid returns seats (if trip is not completed)

## Service Contracts

- `AuthService`
- `TripsService`
- `BookingsService`
- `ReviewsService`
- `AdminService`

Contracts are in `src/services/contracts`.
Mock implementations are in `src/services/mock`.
API implementations are in `src/services/api`.

## Expected API Endpoints

Auth:
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `GET /users/me`
- `PUT /users/me`

Auth response contract used by frontend API services:
- login/register response shape: `{ accessToken, refreshToken, user }`
- refresh request body: `{ refreshToken }`
- refresh response shape: `{ accessToken, refreshToken, user }`
- verify-otp response shape: `{ message }` (no token issuance)

Trips:
- `GET /rides/search`
- `GET /rides/:id`
- `POST /rides`
- `GET /rides/my`
- `PATCH /rides/:id/cancel`
- `PATCH /rides/:id/complete`

Bookings:
- `POST /bookings`
- `GET /bookings/my`
- `GET /bookings/requests`
- `POST /bookings/:id/confirm`
- `POST /bookings/:id/reject`
- `POST /bookings/:id/cancel`

Reviews:
- `POST /reviews`
- `GET /reviews/user/:userId`

Admin:
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/:id/block`
- `PATCH /admin/users/:id/unblock`
- `GET /admin/rides`
- `DELETE /admin/rides/:id`
- `GET /admin/bookings`

## Next Steps for Real Backend

1. Keep contracts stable as the single interface for UI usage.
2. Migrate UI flows incrementally:
   - auth (login/register/profile)
   - trip search/details
   - bookings
   - driver/admin actions
3. Keep auth lifecycle stable:
   - `register/login` store `token` + `refresh_token`
   - expired access token triggers `/auth/refresh` with `{ refreshToken }`
   - refresh success replaces both tokens from `{ accessToken, refreshToken }`
   - refresh failure clears session and redirects to `/auth/login`
4. Move store logic from direct mutations to service-driven actions where needed.
