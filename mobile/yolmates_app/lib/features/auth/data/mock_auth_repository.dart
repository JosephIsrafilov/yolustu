import 'dart:convert';

import 'app_user.dart';
import 'auth_repository.dart';
import 'session_storage.dart';

/// In-memory / storage-backed fake auth.
///
/// - Maintains a multi-account registry (`_accountsKey`) so registration can
///   reject phone/email already connected to another account.
/// - Login validates the password against the registry.
/// - Phone is confirmed with the fixed OTP `123456` (login + register both
///   route through OTP before a session is established).
/// - The active session (`_userKey`) survives restarts via [SessionStorage].
///
/// Passwords are stored in plain text on purpose — this is a local mock with no
/// real security surface.
class MockAuthRepository implements AuthRepository {
  final SessionStorage _storage;

  static const String _userKey = 'auth_user';
  static const String _accountsKey = 'mock_accounts';
  static const String _passwordField = 'password';
  static const String _validCode = '123456';
  static const Duration _latency = Duration(milliseconds: 180);

  /// Seeded so login is testable without registering first.
  static const String _demoPhone = '+994501234567';
  static const String _demoPassword = 'password123';

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

    final accounts = await _readAccounts();
    final index = _indexByPhone(accounts, phone);

    // Mark the matching account verified and promote it to the active session.
    final Map<String, dynamic> record = index >= 0
        ? Map<String, dynamic>.from(accounts[index])
        : {
            'id': 'mock-${phone.hashCode.toUnsigned(32)}',
            'phone': phone,
          };
    record['is_verified'] = true;

    if (index >= 0) {
      accounts[index] = record;
    } else {
      accounts.add(record);
    }
    await _writeAccounts(accounts);

    final user = _toUser(record);
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
    final updated = current.copyWith(isEmailVerified: true);
    await _persist(updated);
    await _syncAccount(updated);
    return updated;
  }

  @override
  Future<AppUser> loginWithPassword(String phone, String password) async {
    await Future.delayed(_latency);
    await _ensureSeeded();

    final accounts = await _readAccounts();
    final index = _indexByPhone(accounts, phone);
    if (index < 0 || accounts[index][_passwordField] != password) {
      throw const AuthException('Telefon və ya şifrə yanlışdır');
    }

    // Credentials are valid, but the session is NOT established here: the caller
    // must confirm the phone via OTP first.
    return _toUser(accounts[index]);
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
    await _ensureSeeded();

    final normalizedEmail = email?.trim().toLowerCase();
    final accounts = await _readAccounts();

    if (_indexByPhone(accounts, phone) >= 0) {
      throw const AuthException('Bu nömrə artıq qeydiyyatdan keçib');
    }
    if (normalizedEmail != null &&
        normalizedEmail.isNotEmpty &&
        _indexByEmail(accounts, normalizedEmail) >= 0) {
      throw const AuthException('Bu e-poçt ünvanı artıq istifadə olunur');
    }

    final user = AppUser(
      id: 'mock-${phone.hashCode.toUnsigned(32)}',
      phone: phone,
      email: email,
      firstName: firstName,
      lastName: lastName,
    );

    accounts.add({
      ...user.toJson(),
      _passwordField: password,
    });
    await _writeAccounts(accounts);

    // No session yet: phone must be confirmed via OTP.
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
    await _syncAccount(updated);
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
    await _syncAccount(updated);
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

    final accounts = await _readAccounts();
    final index = _indexByPhone(accounts, phone);
    if (index >= 0) {
      accounts[index] = {
        ...accounts[index],
        _passwordField: newPassword,
      };
      await _writeAccounts(accounts);
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
    await _syncAccount(updated);
    return updated;
  }

  @override
  Future<void> logout() async {
    // Clear the active session only; registered accounts persist so the user
    // can log back in.
    await _storage.delete(_userKey);
  }

  // --- Internals -------------------------------------------------------------

  Future<void> _persist(AppUser user) async {
    await _storage.write(_userKey, jsonEncode(user.toJson()));
  }

  Future<List<Map<String, dynamic>>> _readAccounts() async {
    final raw = await _storage.read(_accountsKey);
    if (raw == null) return [];
    final decoded = jsonDecode(raw) as List<dynamic>;
    return decoded.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> _writeAccounts(List<Map<String, dynamic>> accounts) async {
    await _storage.write(_accountsKey, jsonEncode(accounts));
  }

  int _indexByPhone(List<Map<String, dynamic>> accounts, String phone) {
    return accounts.indexWhere((a) => a['phone'] == phone);
  }

  int _indexByEmail(List<Map<String, dynamic>> accounts, String email) {
    return accounts.indexWhere(
      (a) => (a['email'] as String?)?.trim().toLowerCase() == email,
    );
  }

  AppUser _toUser(Map<String, dynamic> record) {
    final copy = Map<String, dynamic>.from(record)..remove(_passwordField);
    return AppUser.fromJson(copy);
  }

  /// Keeps the registry record in sync with the active session after profile
  /// edits, so the next login reflects the latest data.
  Future<void> _syncAccount(AppUser user) async {
    final accounts = await _readAccounts();
    final index = accounts.indexWhere((a) => a['id'] == user.id);
    if (index < 0) return;
    final password = accounts[index][_passwordField];
    accounts[index] = {
      ...user.toJson(),
      if (password != null) _passwordField: password,
    };
    await _writeAccounts(accounts);
  }

  /// Seeds a single demo account the first time the registry is touched, so a
  /// fresh install can log in with a known phone/password.
  Future<void> _ensureSeeded() async {
    final raw = await _storage.read(_accountsKey);
    if (raw != null) return;
    const demo = AppUser(
      id: 'mock-demo',
      phone: _demoPhone,
      email: 'demo@yolmates.az',
      firstName: 'Test',
      lastName: 'User',
      isVerified: true,
    );
    await _writeAccounts([
      {
        ...demo.toJson(),
        _passwordField: _demoPassword,
      },
    ]);
  }
}
