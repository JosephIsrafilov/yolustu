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
  static const Duration _latency = Duration(milliseconds: 180);

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
  Future<void> requestEmailVerification() async {
    await Future.delayed(_latency);
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
  Future<AppUser> verifyEmailOtp(String code) async {
    await Future.delayed(_latency);
    if (code != _validCode) {
      throw const AuthException('Invalid or expired code');
    }
    final current = await currentUser();
    if (current == null) {
      throw const AuthException('No active session');
    }
    final updated = current.copyWith();
    await _persist(updated);
    return updated;
  }

  @override
  Future<AppUser> loginWithPassword(String phone, String password) async {
    await Future.delayed(_latency);
    if (password.length < 8) {
      throw const AuthException('Invalid phone or password');
    }
    final existing = await currentUser();
    if (existing != null && existing.phone == phone) {
      return existing;
    }
    final user = AppUser(
      id: 'mock-${phone.hashCode.toUnsigned(32)}',
      phone: phone,
      firstName: 'Test',
      lastName: 'User',
      isVerified: true,
    );
    await _persist(user);
    return user;
  }

  @override
  Future<AppUser> registerWithPassword({
    required String phone,
    String? email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final user = AppUser(
      id: 'usr_mock_new',
      phone: phone,
      email: email,
      firstName: firstName,
      lastName: lastName,
    );
    await _persist(user);
    return user;
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
    await Future.delayed(_latency);
    final current = await currentUser();
    if (current == null) {
      throw const AuthException('No active session');
    }

    final updated = current.copyWith(
      firstName: firstName ?? current.firstName,
      lastName: lastName ?? current.lastName,
      email: email ?? current.email,
      phone: phone ?? current.phone,
      avatarUrl: avatarUrl ?? current.avatarUrl,
      role: role ?? current.role,
      language: language ?? current.language,
      birthDate: birthDate ?? current.birthDate,
    );
    await _persist(updated);
    return updated;
  }

  @override
  Future<AppUser> submitVerification(String documentPath) async {
    await Future.delayed(_latency);
    final current = await currentUser();
    final base = current ?? const AppUser(id: 'mock-anonymous', phone: '');
    final updated = base.copyWith(
      verificationStatus: 'pending',
      documentUrl: documentPath,
    );
    await _persist(updated);
    return updated;
  }

  @override
  Future<void> requestPhonePasswordReset(String phone) async {
    await Future.delayed(_latency);
  }

  @override
  Future<void> resetPasswordWithPhone({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    await Future.delayed(_latency);
    if (code != _validCode) {
      throw const AuthException('Invalid or expired code');
    }
    if (newPassword.length < 8) {
      throw const AuthException('Password must be at least 8 characters');
    }
  }

  @override
  Future<AppUser> mockApproveDriver() async {
    await Future.delayed(_latency);
    final current = await currentUser();
    final base = current ?? const AppUser(id: 'mock-anonymous', phone: '');
    final updated = base.copyWith(
      isVerified: true,
      verificationStatus: 'approved',
      role: UserRole.driver,
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
