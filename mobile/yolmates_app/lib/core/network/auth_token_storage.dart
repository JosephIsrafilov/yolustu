import '../../features/auth/data/session_storage.dart';

/// Stores JWT access/refresh tokens and CSRF token in secure storage.
///
/// Wraps [SessionStorage] with typed keys for auth tokens.
class AuthTokenStorage {
  final SessionStorage _storage;

  static const String _keyAccessToken = 'auth_access_token';
  static const String _keyRefreshToken = 'auth_refresh_token';
  static const String _keyCsrfToken = 'auth_csrf_token';

  AuthTokenStorage(this._storage);

  Future<String?> getAccessToken() => _storage.read(_keyAccessToken);

  Future<String?> getRefreshToken() => _storage.read(_keyRefreshToken);

  Future<String?> getCsrfToken() => _storage.read(_keyCsrfToken);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    String? csrfToken,
  }) async {
    await _storage.write(_keyAccessToken, accessToken);
    await _storage.write(_keyRefreshToken, refreshToken);
    if (csrfToken != null) {
      await _storage.write(_keyCsrfToken, csrfToken);
    }
  }

  Future<void> clearTokens() async {
    await _storage.delete(_keyAccessToken);
    await _storage.delete(_keyRefreshToken);
    await _storage.delete(_keyCsrfToken);
  }
}
