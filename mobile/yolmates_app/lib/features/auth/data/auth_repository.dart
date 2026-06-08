import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_result.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/user.dart';
import '../domain/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  const MockAuthRepository();

  @override
  Future<ApiResult<User>> login({
    required String phoneNumber,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return const ApiSuccess<User>(mockCurrentUser);
  }

  @override
  Future<User?> getCurrentUser() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return mockCurrentUser;
  }

  @override
  Future<void> logout() async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
  }

  @override
  Future<ApiResult<void>> sendOtp(String phoneNumber) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return const ApiSuccess<void>(null);
  }

  @override
  Future<ApiResult<User>> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return const ApiSuccess<User>(mockCurrentUser);
  }
}

class RealAuthRepository implements AuthRepository {
  const RealAuthRepository(this._apiClient, this._storageService);

  final ApiClient _apiClient;
  final SecureStorageService _storageService;

  @override
  Future<ApiResult<User>> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        ApiEndpoints.login,
        data: <String, String>{'phone': phoneNumber, 'password': password},
      );
      final data = response.data ?? <String, dynamic>{};
      final userJson =
          (data['user'] as Map<String, dynamic>?) ?? <String, dynamic>{};
      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;

      if (accessToken == null || accessToken.isEmpty) {
        return const ApiFailure<User>('Login succeeded without access token.');
      }

      await _storageService.saveAccessToken(accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storageService.saveRefreshToken(refreshToken);
      }

      final user = User.fromJson(userJson);
      await _storageService.saveCurrentUser(jsonEncode(user.toJson()));

      return ApiSuccess<User>(user);
    } catch (error) {
      return ApiFailure<User>('Failed to log in: $error');
    }
  }

  @override
  Future<User?> getCurrentUser() async {
    final token = await _storageService.readAccessToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    try {
      final response = await _apiClient.dio.get<Map<String, dynamic>>(
        ApiEndpoints.me,
      );
      final user = User.fromJson(response.data ?? <String, dynamic>{});
      await _storageService.saveCurrentUser(jsonEncode(user.toJson()));
      return user;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> logout() async {
    await _storageService.clearSession();
  }

  @override
  Future<ApiResult<void>> sendOtp(String phoneNumber) async {
    try {
      await _apiClient.dio.post<void>(
        ApiEndpoints.sendOtp,
        queryParameters: <String, String>{'phone': phoneNumber},
      );
      return const ApiSuccess<void>(null);
    } catch (error) {
      return ApiFailure<void>('Failed to send OTP: $error');
    }
  }

  @override
  Future<ApiResult<User>> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        ApiEndpoints.verifyOtp,
        queryParameters: <String, String>{'phone': phoneNumber, 'otp': code},
      );
      final data = response.data ?? <String, dynamic>{};
      if (data['message'] == null) {
        return const ApiFailure<User>('OTP verification response is invalid.');
      }
      return const ApiFailure<User>(
        'OTP verification does not create a mobile session. Use phone and password login in real mode.',
      );
    } catch (error) {
      return ApiFailure<User>('Failed to verify OTP: $error');
    }
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (AppConfig.isMockMode) {
    return const MockAuthRepository();
  }

  return RealAuthRepository(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  );
});
