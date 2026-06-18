import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/api_auth_repository.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';

void main() {
  late Dio dio;
  late DioAdapter dioAdapter;
  late ApiClient apiClient;
  late AuthTokenStorage tokenStorage;
  late SessionStorage sessionStorage;
  late ApiAuthRepository repo;

  setUp(() {
    dio = Dio(BaseOptions(baseUrl: 'http://localhost:8000/api/v1'));
    dioAdapter = DioAdapter(dio: dio);

    final memStorage = InMemorySessionStorage();
    tokenStorage = AuthTokenStorage(memStorage);
    sessionStorage = InMemorySessionStorage();

    apiClient = ApiClient(tokenStorage);
    dioAdapter = DioAdapter(dio: apiClient.dio);

    repo = ApiAuthRepository(apiClient, tokenStorage, sessionStorage);
  });

  group('ApiAuthRepository Integration', () {
    final mockUserJson = {
      'id': 'user-123',
      'phone': '+994501234567',
      'first_name': 'Ali',
      'last_name': 'Mammadov',
      'email': 'ali@example.com',
      'role': 'passenger',
      'language': 'az',
      'is_verified': true,
      'verification_status': 'approved',
    };

    final authSuccessResponse = {
      'accessToken': 'access-token-123',
      'refreshToken': 'refresh-token-123',
      'csrf_token': 'csrf-123',
      'user': mockUserJson,
    };

    test('loginWithPassword successfully maps tokens and user', () async {
      dioAdapter.onPost(
        '/auth/login',
        (server) => server.reply(200, authSuccessResponse),
        data: {'phone': '+994501234567', 'password': 'password123'},
      );

      final user = await repo.loginWithPassword('+994501234567', 'password123');

      expect(user.id, 'user-123');
      expect(user.firstName, 'Ali');
      expect(user.email, 'ali@example.com');

      final access = await tokenStorage.getAccessToken();
      expect(access, 'access-token-123');
    });

    test('registerWithPassword maps correctly', () async {
      dioAdapter.onPost(
        '/auth/register',
        (server) => server.reply(201, authSuccessResponse),
        data: {
          'phone': '+994501234567',
          'email': 'ali@example.com',
          'password': 'password123',
          'first_name': 'Ali',
          'last_name': 'Mammadov',
        },
      );

      final user = await repo.registerWithPassword(
        phone: '+994501234567',
        email: 'ali@example.com',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Mammadov',
      );

      expect(user.id, 'user-123');
      expect(user.firstName, 'Ali');
    });

    test('updateProfile correctly sends and parses data', () async {
      dioAdapter.onPut(
        '/users/me',
        (server) => server.reply(200, {
          ...mockUserJson,
          'first_name': 'Updated',
        }),
        data: {
          'first_name': 'Updated',
          'last_name': 'Mammadov',
        },
      );

      // Pre-seed session so currentUser() isn't null in updateProfile
      await sessionStorage.write('auth_user', jsonEncode(mockUserJson));

      final user = await repo.updateProfile(
        firstName: 'Updated',
        lastName: 'Mammadov',
      );

      expect(user.firstName, 'Updated');
    });
  });
}
