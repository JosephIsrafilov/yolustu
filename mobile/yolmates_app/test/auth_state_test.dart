import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/auth/domain/auth_state.dart';
import 'package:yolmates_app/features/auth/presentation/auth_controller.dart';

import 'test_helpers.dart';

void main() {
  test('auth controller transitions through mock auth lifecycle', () async {
    final container = ProviderContainer(
      overrides: <Override>[inMemoryStorageOverride()],
    );
    addTearDown(container.dispose);

    // Initialize provider and start bootstrap
    final subscription = container.listen<AuthState>(
      authControllerProvider,
      (previous, next) {},
    );
    addTearDown(subscription.close);
    // Wait for bootstrap microtasks
    await Future<void>.delayed(const Duration(milliseconds: 100));
    
    expect(
      container.read(authControllerProvider).status,
      AuthStatus.unauthenticated,
    );

    await container.read(authControllerProvider.notifier).sendOtp('+994501234567');
    await container.read(authControllerProvider.notifier).verifyOtp(
      phoneNumber: '+994501234567',
      otpCode: '123456',
    );

    expect(container.read(authControllerProvider).status, AuthStatus.authenticated);

    await container.read(authControllerProvider.notifier).logout();

    expect(
      container.read(authControllerProvider).status,
      AuthStatus.unauthenticated,
    );
  });
}
