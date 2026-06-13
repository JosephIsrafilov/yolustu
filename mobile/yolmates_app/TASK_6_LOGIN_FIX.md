# Flutter API Mode Login Fix - Task 6

## Root Cause

**Backend auth endpoints expect query parameters, not JSON body.**

Backend routes in `auth_router.py`:
```python
@router.post("/verify-otp")
def verify_otp(
    request: Request,
    phone: str,  # Query param
    otp: str,    # Query param
    ...
):
```

Mobile was sending:
```dart
await _client.post('/auth/verify-otp', data: {
  'phone': phone,
  'otp': code,
});
```

Backend returned 422 validation error because query params were empty.

## Files Changed

**1. `lib/features/auth/data/api_auth_repository.dart`**

**Changes:**
- `sendOtp()` - changed to query params: `/auth/request-otp?phone=...`
- `verifyOtp()` - changed to query params: `/auth/verify-otp?phone=...&otp=...`
- Response parser - added fallback for both `accessToken`/`access_token` and `refreshToken`/`refresh_token`
- Made `csrf_token` optional (backend doesn't return it for OTP auth)
- Phone already normalized correctly with +994 prefix in `phone_login_screen.dart`

## Backend Touched

**No.** Backend auth contract confirmed working as-is.

## Manual Test Command

```bash
cd E:\yolustu\mobile\yolmates_app

# Android emulator
flutter run --dart-define=API_MODE=api --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1

# Windows desktop (if supported)
flutter run -d windows --dart-define=API_MODE=api --dart-define=API_BASE_URL=http://127.0.0.1:8000/api/v1
```

**Test flow:**
1. Backend running: `cd backend && uvicorn app.main:app --reload`
2. Enter phone: 501234567
3. Check backend logs for OTP
4. Enter OTP from logs
5. Should complete profile setup
6. Should enter app logged in

## What Was NOT Fixed

- Role selection removal (started but not completed)
- Booking detail navigation
- Website audit
- Tests/analyzer (per instructions)
