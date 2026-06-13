/// Domain-safe API error exposed to UI/business logic.
class ApiException implements Exception {
  final int? statusCode;
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  const ApiException({
    this.statusCode,
    required this.code,
    required this.message,
    this.details,
  });

  @override
  String toString() => message;

  /// Convenience constructors for common cases.
  factory ApiException.unauthorized([String? msg]) => ApiException(
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: msg ?? 'İstifadəçi təsdiqi tələb olunur',
      );

  factory ApiException.forbidden([String? msg]) => ApiException(
        statusCode: 403,
        code: 'FORBIDDEN',
        message: msg ?? 'Bu əməliyyata icazəniz yoxdur',
      );

  factory ApiException.notFound([String? msg]) => ApiException(
        statusCode: 404,
        code: 'NOT_FOUND',
        message: msg ?? 'Məlumat tapılmadı',
      );

  factory ApiException.conflict([String? msg]) => ApiException(
        statusCode: 409,
        code: 'CONFLICT',
        message: msg ?? 'Məlumat artıq mövcuddur',
      );

  factory ApiException.validation([String? msg]) => ApiException(
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        message: msg ?? 'Məlumat doğrulanması uğursuz oldu',
      );

  factory ApiException.rateLimited([String? msg]) => ApiException(
        statusCode: 429,
        code: 'RATE_LIMITED',
        message: msg ?? 'Çox tez-tez cəhd etdiniz. Zəhmət olmasa gözləyin',
      );

  factory ApiException.serverError([String? msg]) => ApiException(
        statusCode: 500,
        code: 'SERVER_ERROR',
        message: msg ?? 'Server xətası. Zəhmət olmasa yenidən cəhd edin',
      );

  factory ApiException.networkError([String? msg]) => ApiException(
        code: 'NETWORK_ERROR',
        message: msg ?? 'İnternet bağlantısı yoxdur',
      );

  factory ApiException.timeout([String? msg]) => ApiException(
        code: 'TIMEOUT',
        message: msg ?? 'Sorğu vaxtı bitdi. Zəhmət olmasa yenidən cəhd edin',
      );

  factory ApiException.unknown([String? msg]) => ApiException(
        code: 'UNKNOWN_ERROR',
        message: msg ?? 'Gözlənilməz xəta baş verdi',
      );
}
