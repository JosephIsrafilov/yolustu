# Dark Theme Fix Plan

## Current Status
**Decision:** The application is currently locked to the `ThemeMode.light` theme, regardless of the system settings.
**Why:** Dark theme was previously introduced but is not yet reliable. Running the app in dark mode on devices with system dark mode enabled resulted in broken colors, illegible text, and poor contrast due to hardcoded light-only colors remaining in the codebase. To prevent this, the app must remain locked to the stable light theme until the dark theme is fully audited and corrected.

## Scope of Future Dark Theme Fix
The upcoming dark theme fix must systematically address all hardcoded color instances across the app's features and shared widgets, migrating them to be fully theme-aware. This task focuses entirely on UI rendering and will not involve any functional logic changes.

## Checklist for Future Dark Theme Work

- [ ] **Audit all hardcoded colors:** Scan the codebase for raw color usage that ignores the current `ThemeData`.
- [ ] **Replace hardcoded values:** Replace `Colors.white`, `Colors.black`, raw `Colors.grey`, and raw red/green/orange where they break contrast in dark mode.
- [ ] **Migrate to theme tokens:** Move any newly discovered reusable colors into the `AppTheme` tokens and `ColorScheme`.
- [ ] **Fix core components:** Ensure the following elements adapt to the theme correctly:
  - Cards (`AppCard` and custom containers)
  - Text inputs and form fields
  - Dialogs and bottom sheets
  - Bottom navigation bar
  - App bars
  - Map containers and overlays
  - Empty, error, and loading state views
- [ ] **Verify feature screens:** Manually verify every active feature screen (home, search, trips, bookings, chat, driver panel, etc.) in dark mode to ensure perfect readability.
- [ ] **Verify localization:** Ensure no localization strings were accidentally removed or broken during UI refactoring.
- [ ] **Testing:** Add or update golden/widget tests for dark mode if feasible to prevent regressions.
- [ ] **Accessibility check:** Run an accessibility contrast check to verify that text meets the minimum 4.5:1 contrast ratio against dark backgrounds.
- [ ] **Smoke test:** Perform a real device smoke test on both Android and iOS in dark mode.

## Note
The current task *intentionally* does not complete the dark theme.
The files currently controlling the forced light theme mode are:
- `lib/main.dart` (hardcoded `themeMode: ThemeMode.light`)
- `lib/features/settings/settings_screen.dart` (theme selector disabled and replaced with an informational SnackBar)
