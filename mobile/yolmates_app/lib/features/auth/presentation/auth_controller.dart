import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../shared/models/user.dart';
import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    unawaited(_bootstrap());
    return const AuthState.unknown();
  }

  Future<void> _bootstrap() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.readAccessToken();

    if (token == null || token.isEmpty) {
      state = const AuthState.unauthenticated();
      return;
    }

    final cachedUser = await _readCachedUser(storage);
    if (cachedUser != null) {
      state = AuthState.authenticated(cachedUser);
    }

    final user = await ref.read(authRepositoryProvider).getCurrentUser();
    if (user == null) {
      if (cachedUser == null) {
        await storage.clearSession();
        state = const AuthState.unauthenticated();
      }
      return;
    }

    state = AuthState.authenticated(user);
  }

  Future<User?> _readCachedUser(SecureStorageService storage) async {
    final rawUser = await storage.readCurrentUser();
    if (rawUser == null || rawUser.isEmpty) {
      return null;
    }

    try {
      return User.fromJson(jsonDecode(rawUser) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<ApiResult<void>> sendOtp(String phoneNumber) async {
    state = state.copyWith(isBusy: true, clearError: true);
    final result = await ref.read(authRepositoryProvider).sendOtp(phoneNumber);
    state = state.copyWith(
      isBusy: false,
      errorMessage: result is ApiFailure<void> ? result.message : null,
      clearError: result is ApiSuccess<void>,
    );
    return result;
  }

  Future<ApiResult<void>> login({
    required String phoneNumber,
    required String password,
  }) async {
    state = state.copyWith(isBusy: true, clearError: true);
    final result = await ref
        .read(authRepositoryProvider)
        .login(phoneNumber: phoneNumber, password: password);

    if (result case ApiSuccess(:final data)) {
      state = AuthState.authenticated(data);
      return const ApiSuccess<void>(null);
    }

    final failure = result as ApiFailure<User>;
    state = AuthState.unauthenticated(errorMessage: failure.message);
    return ApiFailure<void>(failure.message);
  }

  Future<ApiResult<void>> verifyOtp({
    required String phoneNumber,
    required String otpCode,
  }) async {
    state = state.copyWith(isBusy: true, clearError: true);
    final result = await ref
        .read(authRepositoryProvider)
        .verifyOtp(phoneNumber: phoneNumber, code: otpCode);

    if (result case ApiSuccess(:final data)) {
      if (AppConfig.isMockMode) {
        final storage = ref.read(secureStorageProvider);
        await storage.saveAccessToken('mock-access-token');
        await storage.saveRefreshToken('mock-refresh-token');
        await storage.saveCurrentUser(jsonEncode(data.toJson()));
      }
      state = AuthState.authenticated(data);
      return const ApiSuccess<void>(null);
    }

    final failure = result as ApiFailure<User>;
    state = AuthState.unauthenticated(errorMessage: failure.message);
    return ApiFailure<void>(failure.message);
  }

  Future<void> logout() async {
    state = state.copyWith(isBusy: true);
    await ref.read(authRepositoryProvider).logout();
    final storage = ref.read(secureStorageProvider);
    await storage.clearSession();
    state = const AuthState.unauthenticated();
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
