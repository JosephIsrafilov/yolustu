# Yolmates Mobile App

Flutter foundation for the Android MVP lives here and stays isolated from the existing Next.js and FastAPI codebases.

## Requirements

- Flutter stable
- Android Studio
- Android SDK with at least one Android emulator image
- Java/SDK setup validated by:

```bash
flutter doctor
```

## Install And Check

```bash
cd mobile/yolmates_app
flutter pub get
flutter analyze
flutter test
```

## Create Android Emulator

If `flutter emulators` shows no available emulator:

1. Open Android Studio.
2. Open `Tools` -> `Device Manager`.
3. Click `Create Virtual Device`.
4. Select a Pixel device, for example `Pixel 7`.
5. Select a recent Android system image, for example API 34 or newer.
6. Finish the wizard and start the emulator from Device Manager.
7. Verify detection:

```bash
flutter devices
flutter emulators
```

8. Run the app:

```bash
flutter run
```

## Run In Mock Mode

Mock mode is the default.

```bash
flutter run \
  --dart-define=APP_ENV=dev \
  --dart-define=API_MODE=mock \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

## Run In Real API Mode

Real mode keeps the same UI foundation but repositories call Dio-backed endpoints.

```bash
flutter run \
  --dart-define=APP_ENV=dev \
  --dart-define=API_MODE=real \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

If the backend is unavailable in real mode, screens should show error states instead of crashing.

## Change API Base URL

Default Android emulator API base URL:

```text
http://10.0.2.2:8000/api/v1
```

Override it directly:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

Or use the example file:

```bash
flutter run --dart-define-from-file=env/dev.json
```

Example config lives in `env/dev.json.example`.
Copy it to `env/dev.json` for local Flutter-only values. Do not copy the root `.env` into mobile.

## Available Routes

- `/`
- `/onboarding`
- `/auth/login`
- `/auth/otp`
- `/profile`
- `/profile/setup`
- `/home`
- `/rides/search`
- `/rides/results`
- `/rides/:id`
- `/bookings`
- `/driver`
- `/driver/create-ride`
- `/driver/my-rides`
- `/reviews/create`
- `/settings`

Protected routes currently include:

- `/bookings`
- `/driver`
- `/driver/create-ride`
- `/driver/my-rides`
- `/profile`
- `/profile/setup`
- `/reviews/create`

## Folder Structure

```text
lib/
  app/
  core/
  features/
  shared/
```

- `app/`: bootstrap, router, theme
- `core/`: config, network, storage, localization, reusable widgets
- `features/`: onboarding, auth, profile, rides, bookings, driver, reviews, settings
- `shared/`: models, mock data, reusable presentation widgets

## What Is Mock Right Now

- Phone + OTP login flow
- Current user loading in mock mode
- Ride search/list/details
- Bookings list
- Driver dashboard and create ride form
- Review creation and profile data

## Current Foundation

- Riverpod auth controller with `unknown / unauthenticated / authenticated`
- `go_router` guard wired to auth state
- Secure storage wrapper for access/refresh tokens
- `APP_ENV`, `API_MODE`, `API_BASE_URL` via `--dart-define`
- Repository contracts with mock and real implementations
- Manual `fromJson` and `toJson` for core models
- Shared UI primitives and app shell
- Flutter CI workflow for `pub get`, `analyze`, and `test`

## Commands

```bash
flutter pub get
flutter analyze
flutter test
flutter devices
flutter emulators
flutter run
```

## Next Stage

1. Build the full auth flow UI with validation and better error copy.
2. Connect real auth endpoints and token refresh contract.
3. Replace ride search mocks with backend-backed search and details.
4. Build the create ride wizard and booking request flows.
5. Refine the visual system for MVP screen implementation.
