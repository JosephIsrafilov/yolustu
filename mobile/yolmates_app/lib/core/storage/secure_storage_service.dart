import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  const SecureStorageService(this._storage) : _memoryStore = null;

  SecureStorageService.memory()
    : _storage = null,
      _memoryStore = <String, String>{};

  final FlutterSecureStorage? _storage;
  final Map<String, String>? _memoryStore;

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';

  Future<void> saveAccessToken(String token) async {
    if (_memoryStore != null) {
      _memoryStore[accessTokenKey] = token;
      return;
    }
    await _storage!.write(key: accessTokenKey, value: token);
  }

  Future<void> saveRefreshToken(String token) async {
    if (_memoryStore != null) {
      _memoryStore[refreshTokenKey] = token;
      return;
    }
    await _storage!.write(key: refreshTokenKey, value: token);
  }

  Future<String?> readAccessToken() async {
    if (_memoryStore != null) {
      return _memoryStore[accessTokenKey];
    }
    return _storage!.read(key: accessTokenKey);
  }

  Future<String?> readRefreshToken() async {
    if (_memoryStore != null) {
      return _memoryStore[refreshTokenKey];
    }
    return _storage!.read(key: refreshTokenKey);
  }

  Future<void> clearSession() async {
    if (_memoryStore != null) {
      _memoryStore.clear();
      return;
    }
    await _storage!.deleteAll();
  }
}
