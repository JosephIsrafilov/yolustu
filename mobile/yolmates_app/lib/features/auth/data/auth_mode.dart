/// API mode configuration via --dart-define.
///
/// Usage:
/// ```
/// flutter run --dart-define=API_MODE=api --dart-define=API_BASE_URL=https://63.182.139.73.nip.io/api/v1
/// flutter run --dart-define=API_MODE=mock  # or omit API_MODE entirely
/// ```
///
/// Default is 'mock' to preserve existing behavior.
class AuthMode {
  static const String mode = String.fromEnvironment(
    'API_MODE',
    defaultValue: 'api',
  );

  static bool get isApi => mode.toLowerCase() == 'api';
  static bool get isMock => !isApi;
}
