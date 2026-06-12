import 'dart:convert';

import 'app_user.dart';
import 'auth_repository.dart';
import 'session_storage.dart';

/// In-memory / storage-backed fake auth.
///
/// - Accepts the fixed OTP `123456`.
/// - First verification creates a profile-incomplete user (no names).
/// - Session survives restarts via [SessionStorage].
class MockAuthRepository implements AuthRepository {
  final SessionStorage _storage;

  static const String _userKey = 'auth_user';
  static const String _validCode = '123456';
  static const Duration _latency = Duration(milliseconds: 700);

  MockAuthRepository(this._storage);

  @override
  Future<AppUser?> currentUser() async {
    final raw = await _storage.read(_userKey);
    if (raw == null) return null;
    return AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  @override
  Future<void> sendOtp(String phone) async {
    await Future.delayed(_latency);
    // Mock: always succeeds for a syntactically valid number.
  }

  @override
  Future<AppUser> verifyOtp(String phone, String code) async {
    await Future.delayed(_latency);
    if (code != _validCode) {
      throw const AuthException('Kod yanlışdır və ya vaxtı bitib');
    }
    final existing = await currentUser();
    final user = existing ??
        AppUser(
          id: 'mock-${phone.hashCode.toUnsigned(32)}',
          phone: phone,
        );
    await _persist(user);
    return user;
  }

  @override
  Future<AppUser> updateProfile({
    required String firstName,
    required String lastName,
    String? avatarUrl,
    UserRole? role,
    AppLanguage? language,
  }) async {
    await Future.delayed(_latency);
    final current = await currentUser();
    final base = current ?? const AppUser(id: 'mock-anonymous', phone: '');
    final updated = base.copyWith(
      firstName: firstName,
      lastName: lastName,
      avatarUrl: avatarUrl,
      role: role,
      language: language,
    );
    await _persist(updated);
    return updated;
  }

  @override
  Future<void> logout() async {
    await _storage.delete(_userKey);
  }

  Future<void> _persist(AppUser user) async {
    await _storage.write(_userKey, jsonEncode(user.toJson()));
  }
}
