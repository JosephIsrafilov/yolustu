import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/network/api_result.dart';
import 'package:yolmates_app/core/storage/secure_storage_service.dart';
import 'package:yolmates_app/features/auth/data/auth_repository.dart';
import 'package:yolmates_app/features/auth/domain/auth_repository.dart';
import 'package:yolmates_app/features/auth/domain/auth_state.dart';
import 'package:yolmates_app/features/auth/presentation/auth_controller.dart';
import 'package:yolmates_app/shared/mock/mock_data.dart';
import 'package:yolmates_app/shared/models/user.dart';

import 'test_helpers.dart';

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.user});

  final User? user;
  bool logoutCalled = false;

  @override
  Future<User?> getCurrentUser() async => user;

  @override
  Future<ApiResult<User>> login({
    required String phoneNumber,
    required String password,
  }) async => ApiSuccess<User>(user ?? mockCurrentUser);

  @override
  Future<void> logout() async {
    logoutCalled = true;
  }

  @override
  Future<ApiResult<void>> sendOtp(String phoneNumber) async =>
      const ApiSuccess<void>(null);

  @override
  Future<ApiResult<User>> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async => ApiSuccess<User>(user ?? mockCurrentUser);
}

void main() {
  test('bootstrap restores authenticated session when token and user exist', () async {
    final storage = SecureStorageService.memory();
    await storage.saveAccessToken('token');
    await storage.saveCurrentUser(
      '{"id":"u1","full_name":"Test User","phone":"+994500000001","city":"Baku","rating":5,"completed_trips":2,"verification_status":"verified","role":"passenger"}',
    );
    final repository = _FakeAuthRepository(user: mockCurrentUser);

    final container = ProviderContainer(
      overrides: <Override>[
        inMemoryStorageOverride(storage),
        authRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    container.read(authControllerProvider);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(const Duration(milliseconds: 1));

    expect(
      container.read(authControllerProvider).status,
      AuthStatus.authenticated,
    );
  });

  test('bootstrap keeps cached session when user refresh fails', () async {
    final storage = SecureStorageService.memory();
    await storage.saveAccessToken('token');
    await storage.saveCurrentUser(
      '{"id":"u1","full_name":"Cached User","phone":"+994500000001","city":"Baku","rating":5,"completed_trips":2,"verification_status":"verified","role":"passenger"}',
    );
    final repository = _FakeAuthRepository();

    final container = ProviderContainer(
      overrides: <Override>[
        inMemoryStorageOverride(storage),
        authRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    container.read(authControllerProvider);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(const Duration(milliseconds: 1));

    final state = container.read(authControllerProvider);
    expect(state.status, AuthStatus.authenticated);
    expect(state.user?.fullName, 'Cached User');
  });

  test('logout clears stored session and returns unauthenticated state', () async {
    final storage = SecureStorageService.memory();
    await storage.saveAccessToken('token');
    await storage.saveRefreshToken('refresh');
    await storage.saveCurrentUser(
      '{"id":"u1","full_name":"Test User","phone":"+994500000001","city":"Baku","rating":5,"completed_trips":2,"verification_status":"verified","role":"passenger"}',
    );
    final repository = _FakeAuthRepository(user: mockCurrentUser);

    final container = ProviderContainer(
      overrides: <Override>[
        inMemoryStorageOverride(storage),
        authRepositoryProvider.overrideWithValue(repository),
      ],
    );
    addTearDown(container.dispose);

    final controller = container.read(authControllerProvider.notifier);
    await controller.logout();

    expect(repository.logoutCalled, isTrue);
    expect(await storage.readAccessToken(), isNull);
    expect(await storage.readRefreshToken(), isNull);
    expect(await storage.readCurrentUser(), isNull);
    expect(
      container.read(authControllerProvider).status,
      AuthStatus.unauthenticated,
    );
  });
}
