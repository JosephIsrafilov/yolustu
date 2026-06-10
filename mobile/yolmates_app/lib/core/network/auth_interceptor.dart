import 'package:dio/dio.dart';

import '../storage/secure_storage_service.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._storageService);

  final SecureStorageService _storageService;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storageService.readAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response<dynamic> response, ResponseInterceptorHandler handler) {
    if (response.data != null) {
      if (response.data is Map<String, dynamic>) {
        response.data = _mapUserJson(response.data as Map<String, dynamic>);
      } else if (response.data is List) {
        response.data = (response.data as List).map((dynamic e) {
          if (e is Map<String, dynamic>) {
            return _mapUserJson(e);
          }
          return e;
        }).toList();
      }
    }
    super.onResponse(response, handler);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // TODO(yolmates): add explicit mobile refresh-token contract once backend supports it.
    super.onError(err, handler);
  }

  Map<String, dynamic> _mapUserJson(Map<String, dynamic> json) {
    if (json.containsKey('first_name') || json.containsKey('firstName')) {
      final firstName = json['first_name'] ?? json['firstName'] ?? '';
      final lastName = json['last_name'] ?? json['lastName'] ?? '';
      if (!json.containsKey('full_name') && !json.containsKey('fullName')) {
        json['full_name'] = '$firstName $lastName'.trim();
      }
      if (json.containsKey('total_rides') && !json.containsKey('completed_trips')) {
        json['completed_trips'] = json['total_rides'];
      }
      if (json['verification_status'] == 'approved') {
        json['verification_status'] = 'verified';
      }
    }
    // Recursively check and map nested maps and lists
    for (final key in json.keys.toList()) {
      final val = json[key];
      if (val is Map<String, dynamic>) {
        json[key] = _mapUserJson(val);
      } else if (val is List) {
        json[key] = val.map((dynamic e) {
          if (e is Map<String, dynamic>) {
            return _mapUserJson(e);
          }
          return e;
        }).toList();
      }
    }
    return json;
  }
}
