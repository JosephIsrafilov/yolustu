# Mobile API Foundation

This directory contains the core network layer for all backend API communication.

## Files

- **`api_config.dart`** - Configuration with `--dart-define` support for API base URL
- **`api_client.dart`** - Configured Dio client with auth/CSRF interceptors, automatic 401 refresh, safe logging
- **`api_exception.dart`** - Domain-safe exception type for UI/business logic
- **`api_error_mapper.dart`** - Maps Dio errors and backend error envelopes to `ApiException`
- **`auth_token_storage.dart`** - JWT token storage (access, refresh, CSRF) using `SessionStorage`
- **`providers.dart`** - Riverpod providers for `ApiClient`, `AuthTokenStorage`, etc.

## Configuration

The API base URL is configured via `--dart-define`:

```bash
# Android emulator (10.0.2.2 maps to host machine localhost)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1

# iOS simulator (uses localhost directly)
flutter run --dart-define=API_BASE_URL=http://localhost:8000/api/v1

# Real device or production
flutter run --dart-define=API_BASE_URL=https://api.yolmates.az/api/v1
```

**Default:** `http://10.0.2.2:8000/api/v1` (Android emulator friendly)

## Usage

### Basic Requests

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yolmates_app/core/network/providers.dart';

// In a ConsumerWidget or Notifier:
final client = ref.read(apiClientProvider);

// GET request
final response = await client.get('/users/me');
final user = response.data;

// POST request
final response = await client.post(
  '/auth/login',
  data: {'email': email, 'password': password},
);

// PUT, PATCH, DELETE work similarly
await client.put('/users/me', data: userData);
await client.patch('/rides/123/cancel');
await client.delete('/vehicles/456');
```

### Error Handling

All errors are normalized to `ApiException`:

```dart
try {
  final response = await client.post('/bookings', data: bookingData);
  return response.data;
} on DioException catch (e) {
  final apiError = e.error as ApiException;
  
  if (apiError.statusCode == 401) {
    // Unauthorized - already handled by auto-refresh
  } else if (apiError.statusCode == 429) {
    // Rate limited
    showSnackbar('Çox tez-tez cəhd etdiniz');
  } else {
    showSnackbar(apiError.message);
  }
}
```

### Token Management

Tokens are automatically injected into requests via interceptors:

```dart
final tokenStorage = ref.read(authTokenStorageProvider);

// After login, save tokens from backend response
await tokenStorage.saveTokens(
  accessToken: data['accessToken'],
  refreshToken: data['refreshToken'],
  csrfToken: data['csrf_token'],
);

// On logout, clear tokens
await tokenStorage.clearTokens();
```

### Automatic 401 Refresh

If a request returns 401 and a refresh token exists:

1. The client calls `POST /auth/refresh` automatically
2. New tokens are saved if refresh succeeds
3. Original request is retried once
4. If refresh fails, tokens are cleared

No manual retry logic needed in feature repositories.

## Backend Error Format

The backend returns errors in this envelope:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "İstifadəçi təsdiqi tələb olunur",
    "timestamp": "2026-06-13T10:30:00Z"
  }
}
```

FastAPI validation errors are also supported:

```json
{
  "detail": [
    {"loc": ["body", "email"], "msg": "invalid email", "type": "value_error"}
  ]
}
```

Both are mapped to `ApiException` with user-friendly Azerbaijani messages.

## Safe Logging

In debug builds, the client logs requests/responses but sanitizes sensitive fields:

- `password` → `***`
- `otp` → `***`
- `token` → `***`
- `authorization` header → `***`
- `x-csrf-token` header → `***`

Production builds (`flutter build`) have logging disabled.

## Testing

Use `InMemorySessionStorage` for unit tests:

```dart
final tokenStorage = AuthTokenStorage(InMemorySessionStorage());
final client = ApiClient(tokenStorage);
```

Mock network calls with `dio_mock_adapter` or HTTP mocks.

## Next Steps (Task 3+)

This foundation is ready. Feature repositories can now:

1. Replace `MockAuthRepository` with `ApiAuthRepository(apiClient)`
2. Replace `MockRidesRepository` with `ApiRidesRepository(apiClient)`
3. Replace `MockBookingsRepository` with `ApiBookingsRepository(apiClient)`
4. Add `ApiVehiclesRepository`, `ApiWalletRepository`, etc.

Each repository will use `ref.read(apiClientProvider)` and map responses to domain models.
