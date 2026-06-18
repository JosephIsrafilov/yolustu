import 'dart:io';

import 'package:dio/dio.dart';

import 'api_exception.dart';

/// Maps Dio errors and backend error envelopes to domain [ApiException].
class ApiErrorMapper {
  /// Parse backend error envelope or DioException into ApiException.
  ///
  /// Backend may return:
  /// ```json
  /// {
  ///   "success": false,
  ///   "error": {
  ///     "code": "...",
  ///     "message": "...",
  ///     "timestamp": "..."
  ///   }
  /// }
  /// ```
  ///
  /// Or FastAPI validation errors:
  /// ```json
  /// {
  ///   "detail": [
  ///     {"loc": ["body", "field"], "msg": "...", "type": "..."}
  ///   ]
  /// }
  /// ```
  static ApiException fromDioException(DioException error) {
    final response = error.response;
    final data = response?.data;

    // Try backend error envelope first.
    if (data is Map<String, dynamic>) {
      if (data.containsKey('error') && data['error'] is Map<String, dynamic>) {
        final errorObj = data['error'];
        return ApiException(
          statusCode: response?.statusCode,
          code: errorObj['code'] as String? ?? 'UNKNOWN_ERROR',
          message: errorObj['message'] as String? ?? 'Xəta baş verdi',
          details: errorObj,
        );
      }
      
      // Standalone FastAPI detail string
      if (data.containsKey('detail') && data['detail'] is String) {
        return ApiException(
          statusCode: response?.statusCode,
          code: 'HTTP_EXCEPTION',
          message: data['detail'] as String,
        );
      }

      // FastAPI validation error array
      if (data.containsKey('detail') && data['detail'] is List) {
        final detailList = data['detail'] as List;
        String message = 'Məlumat doğrulanması uğursuz oldu';
        if (detailList.isNotEmpty) {
          final first = detailList.first;
          if (first is Map<String, dynamic> && first.containsKey('msg')) {
            message = first['msg'] as String;
          }
        }
        return ApiException.validation(message);
      }
    }

    // Map DioException type to domain error.
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException.timeout();

      case DioExceptionType.connectionError:
        if (error.error is SocketException) {
          return ApiException.networkError();
        }
        return ApiException.networkError('Serverlə əlaqə saxlanılmadı');

      case DioExceptionType.badResponse:
        final statusCode = response?.statusCode;
        if (statusCode == null) {
          return ApiException.unknown();
        }
        switch (statusCode) {
          case 400:
            return ApiException(
              statusCode: 400,
              code: 'BAD_REQUEST',
              message: data is Map
                  ? (data['message'] as String? ?? 'Sorğu səhvdir')
                  : 'Sorğu səhvdir',
            );
          case 401:
            return ApiException.unauthorized();
          case 403:
            return ApiException.forbidden();
          case 404:
            return ApiException.notFound();
          case 409:
            return ApiException.conflict();
          case 422:
            return ApiException.validation();
          case 429:
            return ApiException.rateLimited();
          case 500:
          case 502:
          case 503:
          case 504:
            return ApiException.serverError();
          default:
            return ApiException(
              statusCode: statusCode,
              code: 'HTTP_$statusCode',
              message: 'Server xətası ($statusCode)',
            );
        }

      case DioExceptionType.cancel:
        return ApiException(
          code: 'CANCELLED',
          message: 'Sorğu ləğv edildi',
        );

      case DioExceptionType.badCertificate:
        return ApiException(
          code: 'BAD_CERTIFICATE',
          message: 'SSL sertifikatı səhvdir',
        );

      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return ApiException.networkError();
        }
        return ApiException.unknown(error.message);
    }
  }
}
