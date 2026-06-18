/// API configuration with --dart-define support.
///
/// Usage:
/// ```
/// flutter run --dart-define=API_BASE_URL=https://63.182.139.73.nip.io/api/v1
/// flutter run --dart-define=API_BASE_URL=https://api.yolmates.az/api/v1
/// ```
class ApiConfig {
  /// Base URL for all API calls.
  ///
  /// Defaults to AWS backend. Override with --dart-define=API_BASE_URL=...
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://63.182.139.73.nip.io/api/v1',
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
