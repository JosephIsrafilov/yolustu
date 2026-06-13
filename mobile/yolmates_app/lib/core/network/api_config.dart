/// API configuration with --dart-define support.
///
/// Usage:
/// ```
/// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
/// flutter run --dart-define=API_BASE_URL=https://api.yolmates.az/api/v1
/// ```
///
/// Android emulator default: 10.0.2.2 maps to host machine localhost.
/// iOS simulator uses localhost directly.
class ApiConfig {
  /// Base URL for all API calls.
  ///
  /// Defaults to Android emulator-friendly local dev server.
  /// Override with --dart-define=API_BASE_URL=...
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  /// Connect timeout in milliseconds.
  static const int connectTimeout = 15000;

  /// Send timeout in milliseconds.
  static const int sendTimeout = 15000;

  /// Receive timeout in milliseconds.
  static const int receiveTimeout = 15000;

  /// Enable detailed logging in debug builds only.
  static const bool enableLogging = bool.fromEnvironment(
        'dart.vm.product',
        defaultValue: true,
      ) ==
      false;
}
