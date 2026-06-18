import 'network/api_config.dart';

class AppConstants {
  // API
  /// @deprecated Use ApiConfig.baseUrl or apiBaseUrlProvider instead.
  /// This constant is kept for backward compatibility but will be removed.
  /// Prefer --dart-define=API_BASE_URL=... for configuration.
  static String get apiBaseUrl => ApiConfig.baseUrl;

  // Cities
  static const List<String> cities = [
    'Bakı',
    'Gəncə',
    'Sumqayıt',
    'Mingəçevir',
    'Şəki',
    'Quba',
    'Lənkəran',
    'Şirvan',
    'Ağdam',
  ];

  // Status
  static const String statusActive = 'active';
  static const String statusCancelled = 'cancelled';
  static const String statusCompleted = 'completed';

  // Spacing
  static const double spacing8 = 8.0;
  static const double spacing12 = 12.0;
  static const double spacing16 = 16.0;
  static const double spacing20 = 20.0;
  static const double spacing24 = 24.0;
  static const double spacing32 = 32.0;

  // Border radius
  static const double borderRadius8 = 8.0;
  static const double borderRadius12 = 12.0;
  static const double borderRadius16 = 16.0;
  static const double borderRadius24 = 24.0;
}
