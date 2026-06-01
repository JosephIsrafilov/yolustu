# Mobile App Readiness (Preparation Only)

## Current backend status
- Project name: Yolmates.
- Runtime stack: FastAPI + SQLAlchemy + Alembic + Redis + JWT + CSRF.
- Supabase role: managed Postgres only (not Supabase Auth).
- Staging status: runtime DB and PostGIS are operational.
- API docs: `/docs` and `/openapi.json` are available.

## Auth strategy: web vs mobile
### Current web flow
- Auth endpoints (`/api/v1/auth/register`, `/api/v1/auth/login`) return `accessToken`, `refreshToken`, `user`.
- Backend also sets `access_token` and `refresh_token` HttpOnly cookies plus `csrf_token`.
- CSRF middleware is active for unsafe methods when cookie auth is used.

### Current mobile feasibility
- Protected endpoints accept `Authorization: Bearer <accessToken>` headers.
- CSRF middleware skips requests with `Authorization: Bearer ...`, so bearer mode is mobile-friendly.
- Current `/api/v1/auth/refresh` implementation reads `refresh_token` from cookies, not from request body.

### Recommended mobile auth plan (no implementation yet)
1. Keep current web mode unchanged: HttpOnly cookie + CSRF.
2. Add explicit mobile refresh mode later (refresh token in request body or dedicated token-rotation endpoint).
3. Store mobile tokens in secure storage (Keychain/Keystore), never in app source.
4. Document token lifetime, rotation, logout, and revocation behavior for mobile clients.

## Required API base URLs
- Android emulator local backend: `http://10.0.2.2:8000`
- iOS simulator local backend: `http://localhost:8000`
- Physical device on LAN: `http://192.168.x.x:8000`
- Staging API base: `https://<staging-api-host>`
- Production API base: `https://<prod-api-host>`

## Environment examples (mobile-facing)
- API base URL should be environment-specific and injected at build/runtime.
- Mobile app must not contain DB credentials or backend secrets.
- Mobile app should call backend API only (not direct database access).

## No-secrets policy
- Never ship `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SECRET_KEY`, or service credentials to mobile.
- `SUPABASE_SERVICE_ROLE_KEY` must never be present in mobile code or frontend bundles.
- Supabase service-role key is not needed for current architecture.

## Geo-search contract (verified)
### Query parameters
- `origin_lat`
- `origin_lon`
- `dest_lat`
- `dest_lon`
- `min_seats`
- `radius_meters`

### Smoke URL
- `/api/v1/rides/search?min_seats=1&origin_lat=40.4093&origin_lon=49.8671&dest_lat=40.6828&dest_lon=46.3606`

### Coordinate conventions
- API payloads use `{ "lat": <number>, "lon": <number> }`.
- Database point order is `POINT(lon lat)` in WKT/PostGIS.
- Mobile clients must not swap lat/lon order.

## CORS / CSRF readiness
- CORS is configured for `FRONTEND_URL`, localhost aliases, and local dev origins.
- Credentials are enabled for browser-based cookie auth.
- For mobile bearer auth, CORS browser-origin behavior is less central, but backend domain and TLS still matter.
- Before mobile release, define final staging/prod API hosts and validate CSRF expectations for hybrid clients.

## Upload / verification readiness
- Upload endpoint exists: `POST /api/v1/users/me/verify` (`multipart/form-data`).
- Avatar upload endpoint exists: `POST /api/v1/users/me/avatar`.
- Allowed verification formats: `.jpg`, `.jpeg`, `.png`, `.pdf`.
- Max upload size: 5 MB.
- Validation errors are returned as JSON HTTP errors (`400`/`413` etc.).
- Current storage is backend file storage (`/uploads`), not presigned object storage.

## Push notifications readiness
- Device token registration endpoint exists: `POST /api/v1/users/me/device-token`.
- Notification service uses WebSocket delivery and optional FCM via Firebase Admin SDK.
- If Firebase is not configured, system falls back gracefully (no crash).
- Gaps before mobile release:
  - Add token metadata (platform: `ios`/`android`/`web`, app version, last_seen).
  - Add token invalidation/unregister flow.
  - Define APNs/FCM environment rollout and monitoring.

## Maps and geo readiness
- Ride create/search flows already use geospatial fields.
- Search radius is configurable via `radius_meters`.
- City fallback search exists (`origin_city`, `dest_city`) when coordinates are absent.
- Response DTOs expose `origin_location` and `destination_location` in `{lat, lon}` format.

## API contract and DTO readiness
- Core domains have request/response schemas: auth, users, rides, bookings, messages, notifications, admin.
- OpenAPI is exposed and usable for client generation.
- Error responses are normalized via global HTTP/Exception handlers with structured JSON payloads.
- Remaining contract gap to resolve before mobile implementation:
  - Align refresh-token contract docs with real cookie-based implementation, then define explicit mobile refresh contract.

## Known gaps before mobile development
- No dedicated mobile refresh-token endpoint contract yet.
- No formal API versioning policy for mobile backward compatibility.
- No documented pagination standard across all list endpoints.
- Upload flow is local filesystem-based; object storage strategy may be needed later.
- Push token model is minimal (token string only).

## Recommended mobile stack
- React Native (Expo) or Flutter.
- Keep backend API contract as the single integration surface.

## First mobile MVP screens
1. Onboarding
2. Login/Register
3. Profile setup
4. Ride search
5. Ride details
6. Booking request
7. My bookings
8. Driver create ride
9. Driver booking requests
10. Profile/verification

## Preparation checklist (no mobile scaffold yet)
- Keep backend auth/cookie flow stable for web.
- Define and approve mobile token-refresh contract.
- Finalize staging/prod API domains and TLS/certificate handling.
- Add API contract notes for mobile error handling and retries.
- Add push token metadata model and unregister endpoint.
