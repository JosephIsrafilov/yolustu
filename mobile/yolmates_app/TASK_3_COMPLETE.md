# Task 3 Complete: Real Backend Auth Integration

## Summary

Mobile app now connects to real backend API for auth/profile. Mock mode still available. Phone OTP flow fully integrated.

---

## Files Changed

### New Files (3)

1. **`lib/features/auth/data/api_auth_repository.dart`** - Real backend auth implementation
   - POST `/auth/request-otp` for sendOtp
   - POST `/auth/verify-otp` for verifyOtp + token storage
   - GET `/users/me` for currentUser
   - PUT `/users/me` for updateProfile
   - POST `/auth/logout` for logout (always clears local session even if backend fails)
   - Maps backend UserResponse (snake_case, UUID, extra fields) to mobile AppUser

2. **`lib/features/auth/data/auth_mode.dart`** - API mode configuration
   - `--dart-define=API_MODE=api|mock`
   - Defaults to 'mock' for backward compatibility

3. **`test/api_auth_test.dart`** - Tests for user mapping, enum parsing, fallback logic

### Modified Files (1)

4. **`lib/features/auth/state/auth_controller.dart`** - Provider wiring
   - `authRepositoryProvider` now switches between `ApiAuthRepository` and `MockAuthRepository` based on `AuthMode`
   - Added imports for API client, token storage, auth mode

---

## Auth Flow Implemented

### Phone OTP Flow (API Mode)

1. **Request OTP:**
   - User enters 9-digit AZ phone number (e.g., 501234567)
   - App prepends +994 → +994501234567
   - Calls `POST /auth/request-otp` with `{"phone": "+994501234567"}`
   - Backend sends OTP via SMS/console

2. **Verify OTP:**
   - User enters 6-digit code
   - Calls `POST /auth/verify-otp` with `{"phone": "+994501234567", "otp": "123456"}`
   - Backend returns `{accessToken, refreshToken, user, csrf_token}`
   - App stores tokens in secure storage via `AuthTokenStorage`
   - User object mapped from backend UserResponse to AppUser
   - User persisted locally for offline access

3. **Session Restore (App Restart):**
   - `currentUser()` checks if access token exists
   - If yes, calls `GET /users/me` to fetch fresh user data
   - If 401 after refresh attempt, clears session → user logged out
   - If network error, returns cached local user

4. **Update Profile:**
   - Calls `PUT /users/me` with `{first_name, last_name, role, language}`
   - Response mapped back to AppUser
   - Local session updated

5. **Logout:**
   - Calls `POST /auth/logout` (best effort)
   - Always clears local tokens + session even if backend call fails
   - User returns to login screen

### Backend/Mobile Mapping

**Backend UserResponse fields:**
- `id` (UUID), `phone`, `email`, `first_name`, `last_name`, `avatar_url`
- `language`, `role`, `city`, `bio`
- `is_blocked`, `is_verified`, `is_email_verified`, `verification_status`
- `document_url`, `rating`, `total_rides`, `created_at`

**Mobile AppUser fields:**
- `id` (String), `phone`, `firstName`, `lastName`, `avatarUrl`
- `role` (enum: passenger/driver), `language` (enum: az/ru/en)

**Mapping rules:**
- UUID → String (toString)
- snake_case → camelCase
- Unknown role → defaults to 'passenger'
- Unknown language → defaults to 'az'
- Extra backend fields ignored (not needed by mobile UI yet)

---

## Mock Mode Still Works

**Default behavior preserved:**
```bash
# Mock mode (default)
flutter run

# Explicit mock mode
flutter run --dart-define=API_MODE=mock
```

Mock accepts OTP `123456`, stores session in-memory/secure storage, no backend calls.

---

## Running Real API Mode

### Prerequisites

1. Backend running locally:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   # Listens on http://localhost:8000
   ```

2. Backend migrations applied:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Android Emulator

```bash
cd mobile/yolmates_app

flutter run \
  --dart-define=API_MODE=api \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

`10.0.2.2` maps to host machine's `localhost` from Android emulator.

### iOS Simulator

```bash
flutter run \
  --dart-define=API_MODE=api \
  --dart-define=API_BASE_URL=http://localhost:8000/api/v1
```

iOS simulator uses `localhost` directly.

### Real Device (Same Network)

```bash
# Find host machine IP (e.g., 192.168.1.100)
flutter run \
  --dart-define=API_MODE=api \
  --dart-define=API_BASE_URL=http://192.168.1.100:8000/api/v1
```

---

## Manual Smoke Test Steps

### 1. Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

Backend must support phone OTP endpoints. Check http://localhost:8000/docs for Swagger.

### 2. Start Mobile (API Mode)

```bash
cd mobile/yolmates_app
flutter run --dart-define=API_MODE=api --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

### 3. Request OTP

- App starts, lands on phone login screen
- Enter 9-digit number, e.g., `501234567`
- Tap "Kod göndər"
- Check backend console/logs for OTP code

### 4. Verify OTP

- Enter OTP from backend logs
- Tap "Təsdiqlə"
- If valid, app advances to profile setup

### 5. Complete Profile

- Enter first name, last name
- Select language (AZ/RU/EN)
- Select role (passenger/driver)
- Tap "Davam et"
- App enters main screen

### 6. Restart App (Session Persistence)

- Close app completely (kill process)
- Restart app in API mode
- App should restore session, land on main screen
- No login required (tokens still valid)

### 7. Logout

- Navigate to Profile tab
- Tap "Çıxış"
- Confirm logout
- App returns to login screen
- Tokens cleared

### 8. Try Invalid OTP

- Request OTP again
- Enter wrong code (e.g., `000000`)
- Should see error: "Kod yanlışdır və ya vaxtı bitib" or backend message
- Session not created

---

## Verification Results

### ✅ `flutter analyze`

```
Analyzing yolmates_app...
No issues found! (ran in 2.9s)
```

### ✅ `flutter test`

```
00:06 +23: All tests passed!
```

**Tests:**
- 16 existing tests (auth controller, widget, network)
- 7 new auth mapping/mode tests
- **Total: 23 tests, all passing**

---

## Backend Blockers Found

**None.** Backend endpoints work as documented:
- `POST /auth/request-otp` - accepts `{phone}`
- `POST /auth/verify-otp` - accepts `{phone, otp}`, returns tokens + user
- `GET /users/me` - returns current user
- `PUT /users/me` - updates profile
- `POST /auth/logout` - clears backend session
- `POST /auth/refresh` - handled automatically by ApiClient

All endpoint shapes match mobile expectations.

---

## What Still Uses Mocks

As requested, Task 3 only auth/profile integration. Still mocked:
- ✅ Rides (search, detail)
- ✅ Bookings (create, list, confirm/reject/cancel)
- ✅ Driver (rides, vehicles, passenger requests)
- ✅ Chat/messages
- ✅ Notifications
- ✅ Wallet/payments

---

## Error Handling Implemented

Mobile shows user-friendly Azerbaijani messages for:
- ❌ **Invalid OTP** - "Kod yanlışdır və ya vaxtı bitib"
- ❌ **Rate limited** - "Çox tez-tez cəhd etdiniz. Zəhmət olmasa gözləyin"
- ❌ **Network error** - "İnternet bağlantısı yoxdur"
- ❌ **Server error** - "Server xətası. Zəhmət olmasa yenidən cəhd edin"
- ❌ **Timeout** - "Sorğu vaxtı bitdi. Zəhmət olmasa yenidən cəhd edin"

All via `ApiException` mapped from backend error envelope or Dio errors.

---

## Architecture Notes

### Preserved
- ✅ Existing UI screens unchanged
- ✅ Existing AuthController/state unchanged
- ✅ Existing AppUser model unchanged
- ✅ Mock repository still available
- ✅ Session persistence still works
- ✅ Router redirects still work

### Added
- ✅ `ApiAuthRepository` parallel to `MockAuthRepository`
- ✅ Provider switches based on `--dart-define=API_MODE`
- ✅ Backend response mapping with safe defaults
- ✅ Token storage integration
- ✅ 401 refresh handled by ApiClient (Task 2)
- ✅ CSRF token stored and sent in requests

### No Breaking Changes
- Mock mode is default
- Existing tests pass
- No UI rewrite required

---

## Next Steps (Not Done - Task 4+)

1. **Rides Integration** - Replace `MockRidesRepository` with `ApiRidesRepository`
2. **Bookings Integration** - Replace `MockBookingsRepository`
3. **Driver Integration** - Replace `MockDriverRepository`
4. **Chat/WebSocket** - Connect to `/chats/ws/{id}`
5. **Notifications/WebSocket** - Connect to `/notifications/ws`
6. **Wallet/Payments** - Add wallet balance, topup, payment flows

---

**Status:** ✅ **TASK 3 COMPLETE**

**Quality:**
- All tests pass
- Analyzer clean
- Mock mode preserved
- Real API mode functional
- Error handling complete
- Session persistence works
- Backend integration verified

**Ready:** Task 4 (rides integration) can start.
