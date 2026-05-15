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
- `NEXT_PUBLIC_DATA_MODE` - `mock` or `api` (default fallback is `mock`).

Switch examples:

```bash
NEXT_PUBLIC_DATA_MODE=mock
NEXT_PUBLIC_DATA_MODE=api
```

Important:
- `api` mode requires a running backend at `NEXT_PUBLIC_API_URL`.
- Without backend, network calls in api mode will fail with `ApiError`.

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
- `POST /auth/logout`
- `GET /users/me`
- `PUT /users/me`

Trips:
- `GET /rides/search`
- `GET /rides/:id`
- `POST /rides`
- `GET /rides/my`
- `PATCH /rides/:id/cancel`
- `PATCH /rides/:id/complete`

Bookings:
- `POST /bookings`
- `GET /bookings/me`
- `GET /bookings/requests`
- `PATCH /bookings/:id/accept`
- `PATCH /bookings/:id/reject`
- `PATCH /bookings/:id/cancel`

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
3. Add auth token provider and refresh flow in `api-client.ts` (TODO is already placed).
4. Move store logic from direct mutations to service-driven actions where needed.
