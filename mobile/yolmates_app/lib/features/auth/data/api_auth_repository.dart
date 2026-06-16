import 'dart:convert';

import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/auth_token_storage.dart';
import 'app_user.dart';
import 'auth_repository.dart';
import 'session_storage.dart';

/// Real backend-backed auth implementation.
///
/// Replaces [MockAuthRepository] when API mode is enabled.
/// Uses backend endpoints:
/// - POST /auth/request-otp
/// - POST /auth/verify-otp
/// - GET /users/me
/// - PUT /users/me
/// - POST /auth/logout
class ApiAuthRepository implements AuthRepository {
  final ApiClient _client;
  final AuthTokenStorage _tokenStorage;
  final SessionStorage _sessionStorage;

  static const String _userKey = 'auth_user';

  ApiAuthRepository(this._client, this._tokenStorage, this._sessionStorage);

  @override
  Future<AppUser?> currentUser() async {
    // Check if tokens exist
    final accessToken = await _tokenStorage.getAccessToken();
    if (accessToken == null) {
      // No token, check local session cache
      final cached = await _sessionStorage.read(_userKey);
      if (cached == null) return null;
      return AppUser.fromJson(jsonDecode(cached) as Map<String, dynamic>);
    }

    // Tokens exist, fetch from backend
    try {
      final response = await _client.get('/users/me');
      final data = response.data as Map<String, dynamic>;
      final user = mapUserResponse(data);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error;
      if (apiError is ApiException && apiError.statusCode == 401) {
        // Unauthorized after refresh attempt, clear session
        await _clearSession();
        return null;
      }
      // Other errors, return cached user if available
      final cached = await _sessionStorage.read(_userKey);
      if (cached != null) {
        return AppUser.fromJson(jsonDecode(cached) as Map<String, dynamic>);
      }
      return null;
    }
  }

  @override
  Future<void> sendOtp(String phone) async {
    try {
      // Backend expects query params, not body
      await _client.post('/auth/request-otp?phone=${Uri.encodeComponent(phone)}');
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> verifyOtp(String phone, String code) async {
    try {
      // Backend expects query params, not body
      final response = await _client.post(
        '/auth/verify-otp?phone=${Uri.encodeComponent(phone)}&otp=${Uri.encodeComponent(code)}',
      );

      final data = response.data as Map<String, dynamic>;

      // Backend returns AuthSessionResponse: {accessToken, refreshToken, user}
      // Extract tokens (support both camelCase and snake_case)
      final accessToken = data['accessToken'] as String? ??
                          data['access_token'] as String?;
      final refreshToken = data['refreshToken'] as String? ??
                           data['refresh_token'] as String?;
      final csrfToken = data['csrf_token'] as String?; // Optional

      if (accessToken == null || refreshToken == null) {
        throw const AuthException('Token alınmadı');
      }

      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        csrfToken: csrfToken,
      );

      // Map and persist user
      final userJson = data['user'] as Map<String, dynamic>?;
      if (userJson == null) {
        throw const AuthException('İstifadəçi məlumatı alınmadı');
      }

      final user = mapUserResponse(userJson);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> updateProfile({
    required String firstName,
    required String lastName,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
  }) async {
    try {
      String? remoteAvatarUrl = avatarUrl;
      
      if (avatarUrl != null && !avatarUrl.startsWith('http')) {
        final formData = FormData.fromMap({
          'file': await MultipartFile.fromFile(
            avatarUrl,
            filename: avatarUrl.split('/').last,
          ),
        });
        
        final uploadResp = await _client.post(
          '/users/me/avatar',
          data: formData,
        );
        final uploadData = uploadResp.data as Map<String, dynamic>;
        remoteAvatarUrl = uploadData['avatar_url'] as String?;
      }

      final response = await _client.put('/users/me', data: {
        'first_name': firstName,
        'last_name': lastName,
        if (remoteAvatarUrl != null) 'avatar_url': remoteAvatarUrl,
        if (role != null) 'role': role.name,
        if (language != null) 'language': language.name,
      });

      final data = response.data as Map<String, dynamic>;
      final user = mapUserResponse(data);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> submitVerification(String documentPath) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          [1, 2, 3, 4],
          filename: 'verification.png',
        ),
      });

      final response = await _client.post(
        '/users/me/verify',
        data: formData,
      );

      final data = response.data as Map<String, dynamic>;
      final user = mapUserResponse(data);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> mockApproveDriver() {
    throw UnimplementedError('Mock driver approval is only supported in mock mode.');
  }

  @override
  Future<void> logout() async {
    // Always clear local session even if backend logout fails
    try {
      await _client.post('/auth/logout');
    } catch (_) {
      // Ignore backend logout errors
    } finally {
      await _clearSession();
    }
  }

  /// Map backend UserResponse to mobile AppUser.
  ///
  /// Backend fields (snake_case):
  /// - id, phone, email, first_name, last_name, avatar_url, language, role
  /// - city, bio, is_blocked, is_verified, is_email_verified
  /// - verification_status, document_url, rating, total_rides, created_at
  ///
  /// Mobile fields (camelCase):
  /// - id, phone, firstName, lastName, avatarUrl, role, language
  ///
  /// Visible for testing.
  AppUser mapUserResponse(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(), // UUID to String
      phone: json['phone'] as String? ?? '',
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      role: _parseRole(json['role'] as String?),
      language: _parseLanguage(json['language'] as String?),
      isVerified: json['is_verified'] as bool? ?? false,
      verificationStatus: json['verification_status'] as String? ?? 'none',
      documentUrl: json['document_url'] as String?,
    );
  }

  UserRole _parseRole(String? role) {
    if (role == null) return UserRole.passenger;
    try {
      return UserRole.values.firstWhere((r) => r.name == role);
    } catch (_) {
      return UserRole.passenger;
    }
  }

  AppLanguage _parseLanguage(String? language) {
    if (language == null) return AppLanguage.az;
    try {
      return AppLanguage.values.firstWhere((l) => l.name == language);
    } catch (_) {
      return AppLanguage.az;
    }
  }

  Future<void> _persistUser(AppUser user) async {
    await _sessionStorage.write(_userKey, jsonEncode(user.toJson()));
  }

  Future<void> _clearSession() async {
    await _tokenStorage.clearTokens();
    await _sessionStorage.delete(_userKey);
  }
}
