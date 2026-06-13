import 'package:flutter_test/flutter_test.dart';

import 'package:yolmates_app/core/network/api_config.dart';
import 'package:yolmates_app/core/network/api_exception.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';

void main() {
  group('ApiConfig', () {
    test('has sensible defaults for development', () {
      expect(ApiConfig.baseUrl, isNotEmpty);
      expect(ApiConfig.connectTimeout, greaterThan(0));
      expect(ApiConfig.sendTimeout, greaterThan(0));
      expect(ApiConfig.receiveTimeout, greaterThan(0));
    });
  });

  group('ApiException', () {
    test('unauthorized creates 401 exception', () {
      final ex = ApiException.unauthorized();
      expect(ex.statusCode, 401);
      expect(ex.code, 'UNAUTHORIZED');
      expect(ex.message, isNotEmpty);
    });

    test('notFound creates 404 exception', () {
      final ex = ApiException.notFound();
      expect(ex.statusCode, 404);
      expect(ex.code, 'NOT_FOUND');
    });

    test('networkError has no status code', () {
      final ex = ApiException.networkError();
      expect(ex.statusCode, isNull);
      expect(ex.code, 'NETWORK_ERROR');
    });
  });

  group('AuthTokenStorage', () {
    late AuthTokenStorage storage;

    setUp(() {
      storage = AuthTokenStorage(InMemorySessionStorage());
    });

    test('starts empty', () async {
      expect(await storage.getAccessToken(), isNull);
      expect(await storage.getRefreshToken(), isNull);
      expect(await storage.getCsrfToken(), isNull);
    });

    test('saveTokens stores all tokens', () async {
      await storage.saveTokens(
        accessToken: 'access123',
        refreshToken: 'refresh456',
        csrfToken: 'csrf789',
      );

      expect(await storage.getAccessToken(), 'access123');
      expect(await storage.getRefreshToken(), 'refresh456');
      expect(await storage.getCsrfToken(), 'csrf789');
    });

    test('saveTokens without csrf still works', () async {
      await storage.saveTokens(
        accessToken: 'access123',
        refreshToken: 'refresh456',
      );

      expect(await storage.getAccessToken(), 'access123');
      expect(await storage.getRefreshToken(), 'refresh456');
      expect(await storage.getCsrfToken(), isNull);
    });

    test('clearTokens removes all tokens', () async {
      await storage.saveTokens(
        accessToken: 'access123',
        refreshToken: 'refresh456',
        csrfToken: 'csrf789',
      );

      await storage.clearTokens();

      expect(await storage.getAccessToken(), isNull);
      expect(await storage.getRefreshToken(), isNull);
      expect(await storage.getCsrfToken(), isNull);
    });
  });
}
