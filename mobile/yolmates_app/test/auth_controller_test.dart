import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'package:yolmates_app/features/auth/data/auth_repository.dart';
import 'package:yolmates_app/features/auth/data/mock_auth_repository.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/auth/state/auth_controller.dart';

/// Builds a container with in-memory session storage so no platform
/// keystore is touched during tests.
ProviderContainer _makeContainer({bool onboardingSeen = true}) {
  final storage = InMemorySessionStorage();
  if (onboardingSeen) {
    storage.write('onboarding_seen', 'true');
  }
  final container = ProviderContainer(
    overrides: [
      sessionStorageProvider.overrideWithValue(storage),
      authRepositoryProvider.overrideWith((ref) => MockAuthRepository(storage)),
    ],
  );
  addTearDown(container.dispose);
  return container;
}

/// Waits until the controller leaves the [AuthStatus.unknown] bootstrap state.
Future<AuthState> _settled(ProviderContainer c) async {
  while (c.read(authControllerProvider).status == AuthStatus.unknown) {
    await Future<void>.delayed(const Duration(milliseconds: 20));
  }
  return c.read(authControllerProvider);
}

void main() {
  group('AuthController bootstrap', () {
    test('starts on onboarding with empty storage', () async {
      final c = _makeContainer(onboardingSeen: false);
      final state = await _settled(c);
      expect(state.status, AuthStatus.onboarding);
      expect(state.user, isNull);
    });

    test('starts unauthenticated if onboarding already seen', () async {
      final c = _makeContainer(onboardingSeen: true);
      final state = await _settled(c);
      expect(state.status, AuthStatus.unauthenticated);
      expect(state.user, isNull);
    });
  });

  group('verifyOtp', () {
    test('valid code creates a profile-incomplete user', () async {
      final c = _makeContainer();
      await _settled(c);

      await c
          .read(authControllerProvider.notifier)
          .verifyOtp('+994501112233', '123456');

      final state = c.read(authControllerProvider);
      expect(state.status, AuthStatus.incompleteProfile);
      expect(state.user, isNotNull);
      expect(state.user!.isProfileComplete, isFalse);
    });

    test('wrong code throws AuthException and keeps session empty', () async {
      final c = _makeContainer();
      await _settled(c);

      expect(
        () => c
            .read(authControllerProvider.notifier)
            .verifyOtp('+994501112233', '000000'),
        throwsA(isA<AuthException>()),
      );

      final state = c.read(authControllerProvider);
      expect(state.status, AuthStatus.unauthenticated);
    });
  });

  group('completeProfile', () {
    test('filling names advances to authenticated', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await notifier.verifyOtp('+994501112233', '123456');
      await notifier.completeProfile(
        firstName: 'Rəşad',
        lastName: 'Süleymanov',
        role: UserRole.driver,
        language: AppLanguage.az,
      );

      final state = c.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user!.isProfileComplete, isTrue);
      expect(state.user!.fullName, 'Rəşad Süleymanov');
      expect(state.user!.role, UserRole.driver);
    });
  });

  group('loginWithPassword', () {
    test('seeded demo account: correct password leaves session pending OTP',
        () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      final user =
          await notifier.loginWithPassword('+994501234567', 'password123');

      // Credentials accepted, but no session yet — phone awaits OTP.
      expect(user.phone, '+994501234567');
      expect(c.read(authControllerProvider).status,
          AuthStatus.unauthenticated);

      // OTP confirms the phone and establishes the session.
      await notifier.verifyOtp('+994501234567', '123456');
      expect(c.read(authControllerProvider).status, AuthStatus.authenticated);
    });

    test('wrong password throws and keeps session empty', () async {
      final c = _makeContainer();
      await _settled(c);

      await expectLater(
        () => c
            .read(authControllerProvider.notifier)
            .loginWithPassword('+994501234567', 'wrong-password'),
        throwsA(isA<AuthException>()),
      );
      expect(c.read(authControllerProvider).status,
          AuthStatus.unauthenticated);
    });

    test('unknown phone throws', () async {
      final c = _makeContainer();
      await _settled(c);

      await expectLater(
        () => c
            .read(authControllerProvider.notifier)
            .loginWithPassword('+994559998877', 'password123'),
        throwsA(isA<AuthException>()),
      );
    });
  });

  group('registerWithPassword', () {
    test('new account stays pending OTP, then verifies', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await notifier.registerWithPassword(
        phone: '+994701112233',
        email: 'new@yolmates.az',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Valiyev',
      );
      expect(c.read(authControllerProvider).status,
          AuthStatus.unauthenticated);

      await notifier.verifyOtp('+994701112233', '123456');
      final state = c.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.user!.fullName, 'Ali Valiyev');
    });

    test('duplicate phone is rejected', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await expectLater(
        () => notifier.registerWithPassword(
          phone: '+994501234567', // seeded demo phone
          email: 'other@yolmates.az',
          password: 'password123',
          firstName: 'Dup',
          lastName: 'Phone',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('duplicate email is rejected (case-insensitive)', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await expectLater(
        () => notifier.registerWithPassword(
          phone: '+994559998877',
          email: 'DEMO@yolmates.az', // seeded demo email, different case
          password: 'password123',
          firstName: 'Dup',
          lastName: 'Email',
        ),
        throwsA(isA<AuthException>()),
      );
    });

    test('after registering, the new account can log in', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await notifier.registerWithPassword(
        phone: '+994701112233',
        email: 'new@yolmates.az',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Valiyev',
      );

      final user =
          await notifier.loginWithPassword('+994701112233', 'password123');
      expect(user.phone, '+994701112233');
    });
  });

  group('logout', () {
    test('clears the session back to unauthenticated', () async {
      final c = _makeContainer();
      await _settled(c);
      final notifier = c.read(authControllerProvider.notifier);

      await notifier.verifyOtp('+994501112233', '123456');
      await notifier.completeProfile(firstName: 'A', lastName: 'B');
      expect(c.read(authControllerProvider).status, AuthStatus.authenticated);

      await notifier.logout();
      expect(c.read(authControllerProvider).status, AuthStatus.unauthenticated);
      expect(c.read(authControllerProvider).user, isNull);
    });
  });

  group('session persistence', () {
    test('a completed profile survives a fresh controller on same storage',
        () async {
      final storage = InMemorySessionStorage();
      storage.write('onboarding_seen', 'true');
      final overrides = [
        sessionStorageProvider.overrideWithValue(storage),
        authRepositoryProvider
            .overrideWith((ref) => MockAuthRepository(storage)),
      ];

      final c1 = ProviderContainer(overrides: overrides);
      while (c1.read(authControllerProvider).status == AuthStatus.unknown) {
        await Future<void>.delayed(const Duration(milliseconds: 20));
      }
      final n1 = c1.read(authControllerProvider.notifier);
      await n1.verifyOtp('+994501112233', '123456');
      await n1.completeProfile(firstName: 'A', lastName: 'B');
      c1.dispose();

      // New container, same storage -> should resolve to authenticated.
      final c2 = ProviderContainer(overrides: overrides);
      addTearDown(c2.dispose);
      AuthState state = c2.read(authControllerProvider);
      while (state.status == AuthStatus.unknown) {
        await Future<void>.delayed(const Duration(milliseconds: 20));
        state = c2.read(authControllerProvider);
      }
      expect(state.status, AuthStatus.authenticated);
    });
  });
}
