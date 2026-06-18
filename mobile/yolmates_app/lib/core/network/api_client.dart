import 'dart:developer' as developer;

import 'package:dio/dio.dart';

import 'api_config.dart';
import 'api_error_mapper.dart';
import 'api_exception.dart';
import 'auth_token_storage.dart';

/// Configured Dio client for all backend API calls.
///
/// Features:
/// - Authorization header injection from stored tokens
/// - Optional CSRF header injection
/// - 401 automatic refresh with retry
/// - Safe logging (no token/password/OTP leaks)
/// - Error normalization to [ApiException]
class ApiClient {
  final Dio _dio;
  final AuthTokenStorage _tokenStorage;

  /// Prevent infinite refresh loops.
  bool _isRefreshing = false;

  ApiClient(this._tokenStorage)
      : _dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.baseUrl,
            connectTimeout:
                const Duration(milliseconds: ApiConfig.connectTimeout),
            sendTimeout: const Duration(milliseconds: ApiConfig.sendTimeout),
            receiveTimeout:
                const Duration(milliseconds: ApiConfig.receiveTimeout),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(_AuthInterceptor(_tokenStorage));
    if (ApiConfig.enableLogging) {
      _dio.interceptors.add(_SafeLogInterceptor());
    }
    _dio.interceptors.add(_ErrorInterceptor());
  }

  /// Public Dio instance for direct use or custom calls.
  Dio get dio => _dio;

  /// GET request with automatic error mapping.
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 && !_isRefreshing) {
        await _refreshAndRetry();
        return await _dio.get<T>(
          path,
          queryParameters: queryParameters,
          options: options,
        );
      }
      rethrow;
    }
  }

  /// POST request with automatic error mapping.
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 &&
          !_isRefreshing &&
          path != '/auth/refresh') {
        await _refreshAndRetry();
        return await _dio.post<T>(
          path,
          data: data is FormData ? data.clone() : data,
          queryParameters: queryParameters,
          options: options,
        );
      }
      rethrow;
    }
  }

  /// PUT request with automatic error mapping.
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 && !_isRefreshing) {
        await _refreshAndRetry();
        return await _dio.put<T>(
          path,
          data: data,
          queryParameters: queryParameters,
          options: options,
        );
      }
      rethrow;
    }
  }

  /// PATCH request with automatic error mapping.
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 && !_isRefreshing) {
        await _refreshAndRetry();
        return await _dio.patch<T>(
          path,
          data: data,
          queryParameters: queryParameters,
          options: options,
        );
      }
      rethrow;
    }
  }

  /// DELETE request with automatic error mapping.
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 && !_isRefreshing) {
        await _refreshAndRetry();
        return await _dio.delete<T>(
          path,
          data: data,
          queryParameters: queryParameters,
          options: options,
        );
      }
      rethrow;
    }
  }

  /// Refresh access token using refresh token, then retry.
  Future<void> _refreshAndRetry() async {
    _isRefreshing = true;
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null) {
        await _tokenStorage.clearTokens();
        throw ApiException.unauthorized();
      }

      final response = await _dio
          .post('/auth/refresh', data: {'refresh_token': refreshToken});
      final data = response.data;

      if (data is Map<String, dynamic>) {
        final newAccessToken = data['accessToken'] as String?;
        final newRefreshToken = data['refreshToken'] as String?;
        final csrfToken = data['csrf_token'] as String?;

        if (newAccessToken != null && newRefreshToken != null) {
          await _tokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            csrfToken: csrfToken,
          );
          return;
        }
      }

      await _tokenStorage.clearTokens();
      throw ApiException.unauthorized();
    } catch (e) {
      await _tokenStorage.clearTokens();
      if (e is ApiException) rethrow;
      throw ApiException.unauthorized();
    } finally {
      _isRefreshing = false;
    }
  }
}

/// Injects Authorization and X-CSRF-Token headers from storage.
class _AuthInterceptor extends Interceptor {
  final AuthTokenStorage _tokenStorage;

  _AuthInterceptor(this._tokenStorage);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final accessToken = await _tokenStorage.getAccessToken();
    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    final csrfToken = await _tokenStorage.getCsrfToken();
    if (csrfToken != null) {
      options.headers['X-CSRF-Token'] = csrfToken;
    }

    handler.next(options);
  }
}

/// Logs requests/responses without exposing secrets.
class _SafeLogInterceptor extends Interceptor {
  static final _sensitiveKeys = {
    'password',
    'otp',
    'code',
    'token',
    'authorization',
    'x-csrf-token',
  };

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '→ ${options.method} ${options.uri}',
      name: 'ApiClient',
    );
    if (options.data != null) {
      final sanitized = _sanitize(options.data);
      developer.log('  Body: $sanitized', name: 'ApiClient');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '← ${response.statusCode} ${response.requestOptions.uri}',
      name: 'ApiClient',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '✖ ${err.type} ${err.requestOptions.uri}',
      name: 'ApiClient',
      error: err.message,
    );
    handler.next(err);
  }

  dynamic _sanitize(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data.map((key, value) {
        if (_sensitiveKeys.contains(key.toLowerCase())) {
          return MapEntry(key, '***');
        }
        return MapEntry(key, _sanitize(value));
      });
    } else if (data is List) {
      return data.map(_sanitize).toList();
    }
    return data;
  }
}

/// Converts DioException to ApiException.
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final apiException = ApiErrorMapper.fromDioException(err);
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: apiException,
        message: apiException.message,
      ),
    );
  }
}
