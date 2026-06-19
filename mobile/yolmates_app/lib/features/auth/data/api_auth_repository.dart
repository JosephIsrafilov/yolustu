import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as path;

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
      await _client
          .post('/auth/request-otp?phone=${Uri.encodeComponent(phone)}');
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<void> requestEmailVerification() async {
    try {
      await _client.post('/auth/request-email-verification');
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Unexpected error');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> verifyOtp(String phone, String code) async {
    try {
      // Backend expects query params, not body
      await _client.post(
        '/auth/verify-otp?phone=${Uri.encodeComponent(phone)}&otp=${Uri.encodeComponent(code)}',
      );

      // Backend verify_otp only returns {"message": ...}
      // Tokens are already saved from login/register, so we just fetch the updated user.
      final meResponse = await _client.get('/users/me');
      final userJson = meResponse.data as Map<String, dynamic>?;

      if (userJson == null) {
        throw const AuthException('İstifadəçi məlumatı alınmadı');
      }

      final user = mapUserResponse(userJson);
      await _persistUser(user);
      return user;
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> verifyEmailOtp(String code) async {
    try {
      final response = await _client.post('/auth/verify-email', data: {
        'otp': code,
      });
      final userJson = response.data as Map<String, dynamic>?;
      if (userJson == null) {
        throw const AuthException('User data was not returned');
      }
      final user = mapUserResponse(userJson);
      await _persistUser(user);
      return user;
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Unexpected error');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> loginWithPassword(String phone, String password) async {
    try {
      final response = await _client.post(
        '/auth/login',
        data: {'phone': phone, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['access_token'] as String?;
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;
      final csrfToken = data['csrf_token'] as String?;

      if (accessToken == null || refreshToken == null) {
        throw const AuthException('Token alınmadı');
      }

      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        csrfToken: csrfToken,
      );

      final userJson = data['user'] as Map<String, dynamic>?;
      if (userJson == null) {
        throw const AuthException('İstifadəçi məlumatı alınmadı');
      }

      if (userJson['role'] == 'admin') {
        throw const AuthException(
            'Admin hesabı ilə mobil tətbiqə giriş mümkün deyil.');
      }

      final user = mapUserResponse(userJson);
      await _persistUser(user);
      return user;
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> registerWithPassword({
    required String phone,
    String? email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _client.post(
        '/auth/register',
        data: {
          'phone': phone,
          if (email != null) 'email': email,
          'password': password,
          'first_name': firstName,
          'last_name': lastName,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final accessToken =
          data['accessToken'] as String? ?? data['access_token'] as String?;
      final refreshToken =
          data['refreshToken'] as String? ?? data['refresh_token'] as String?;
      final csrfToken = data['csrf_token'] as String?;

      if (accessToken == null || refreshToken == null) {
        throw const AuthException('Token alınmadı');
      }

      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        csrfToken: csrfToken,
      );

      final userJson = data['user'] as Map<String, dynamic>?;
      if (userJson == null) {
        throw const AuthException('İstifadəçi məlumatı alınmadı');
      }

      final user = mapUserResponse(userJson);
      await _persistUser(user);
      return user;
    } on ApiException catch (e) {
      throw AuthException(e.message);
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
    DateTime? birthDate,
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
        if (firstName != null) 'first_name': firstName,
        if (lastName != null) 'last_name': lastName,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (remoteAvatarUrl != null) 'avatar_url': remoteAvatarUrl,
        if (role != null) 'role': role.name,
        if (language != null) 'language': language.name,
        if (birthDate != null)
          'birth_date': birthDate.toIso8601String().split('T').first,
      });

      final data = response.data as Map<String, dynamic>;
      final user = mapUserResponse(data);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> submitVerification(String documentPath) async {
    try {
      final extension = path.extension(documentPath).toLowerCase();
      final contentType = switch (extension) {
        '.jpg' || '.jpeg' => MediaType('image', 'jpeg'),
        '.png' => MediaType('image', 'png'),
        '.pdf' => MediaType('application', 'pdf'),
        _ => throw const AuthException('Dəstəklənməyən fayl növü'),
      };
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          documentPath,
          filename: documentPath.split('/').last,
          contentType: contentType,
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
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<void> requestPhonePasswordReset(String phone) async {
    try {
      await _client.post(
        '/auth/request-phone-password-reset',
        data: {'phone': phone},
      );
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Unexpected error');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<void> resetPasswordWithPhone({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    try {
      await _client.post(
        '/auth/reset-password-phone',
        data: {
          'phone': phone,
          'code': code,
          'new_password': newPassword,
        },
      );
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Unexpected error');
      throw AuthException(apiError.message);
    }
  }

  @override
  Future<AppUser> mockApproveDriver() async {
    try {
      final response = await _client.post('/users/me/mock-verify');
      final data = response.data as Map<String, dynamic>;
      final user = mapUserResponse(data);
      await _persistUser(user);
      return user;
    } on DioException catch (e) {
      final apiError = e.error is ApiException
          ? e.error as ApiException
          : ApiException(
              code: 'unknown', message: e.message ?? 'Xəta baş verdi');
      throw AuthException(apiError.message);
    }
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
      email: json['email'] as String?,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      role: _parseRole(json['role'] as String?),
      language: _parseLanguage(json['language'] as String?),
      isVerified: json['is_verified'] as bool? ?? false,
      isEmailVerified: json['is_email_verified'] as bool? ?? false,
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
