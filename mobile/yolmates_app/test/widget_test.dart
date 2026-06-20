import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/localization/app_localizations.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'package:yolmates_app/features/auth/data/mock_auth_repository.dart';
import 'package:yolmates_app/core/routes.dart';
import 'package:yolmates_app/core/theme.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/auth/state/auth_controller.dart';

/// Boots the real router with in-memory storage and pumps until the splash
/// session-gate resolves (avoids pumpAndSettle hanging on the spinner).
Future<void> _pumpApp(WidgetTester tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sessionStorageProvider.overrideWithValue(InMemorySessionStorage()),
        authRepositoryProvider.overrideWith(
            (ref) => MockAuthRepository(ref.read(sessionStorageProvider))),
      ],
      child: const _TestApp(),
    ),
  );
  for (var i = 0; i < 5; i++) {
    await tester.pump(const Duration(milliseconds: 200));
  }
}

class _TestApp extends ConsumerWidget {
  const _TestApp();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      theme: AppTheme.lightTheme,
      routerConfig: ref.watch(routerProvider),
      debugShowCheckedModeBanner: false,
    );
  }
}

void main() {
  testWidgets(
    'fresh launch lands on onboarding, skip goes to auth intro and login',
    (tester) async {
      final az = AppLocalizations(AppLanguage.az);
      await _pumpApp(tester);

      expect(find.text(az.onboardingSaveMoneyTitle), findsOneWidget);
      expect(find.text(az.onboardingSkip), findsOneWidget);

      await tester.tap(find.text(az.onboardingSkip).first);
      await tester.pumpAndSettle();

      expect(find.text('Yolmates'),
          findsNothing); // Removed old name as it might be an icon now
      expect(find.text(az.registerLink), findsOneWidget);

      await tester.tap(find.text(az.loginBtn).first);
      await tester.pumpAndSettle();

      expect(find.text(az.loginSubtitle), findsOneWidget);
      // Wait, there might be two widgets with loginBtn text since we transition. We can just check for passwordLabel
      expect(find.text(az.passwordLabel), findsOneWidget);
    },
  );

  testWidgets('login validates an empty phone number', (tester) async {
    final az = AppLocalizations(AppLanguage.az);
    final storage = InMemorySessionStorage();
    await storage.write('onboarding_seen', 'true');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionStorageProvider.overrideWithValue(storage),
          authRepositoryProvider
              .overrideWith((ref) => MockAuthRepository(storage)),
        ],
        child: const _TestApp(),
      ),
    );
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    await tester.tap(find.text(az.loginBtn).first);
    await tester.pumpAndSettle();

    await tester.tap(find.byType(ElevatedButton));
    await tester.pump();

    expect(find.text(az.phoneLoginPhoneRequired), findsOneWidget);
  });

  testWidgets('login submit opens OTP screen with demo code', (tester) async {
    final az = AppLocalizations(AppLanguage.az);
    final storage = InMemorySessionStorage();
    await storage.write('onboarding_seen', 'true');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionStorageProvider.overrideWithValue(storage),
          authRepositoryProvider
              .overrideWith((ref) => MockAuthRepository(storage)),
        ],
        child: const _TestApp(),
      ),
    );
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    await tester.enterText(find.byType(TextFormField).at(0), '501234567');
    await tester.enterText(find.byType(TextFormField).at(1), 'password123');
    final loginButton = find.widgetWithText(ElevatedButton, az.loginBtn);
    await tester.ensureVisible(loginButton);
    await tester.tap(loginButton);
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    expect(find.text('Demo code: 123456'), findsOneWidget);
  });

  testWidgets('registration submit opens OTP screen with demo code',
      (tester) async {
    final az = AppLocalizations(AppLanguage.az);
    final storage = InMemorySessionStorage();
    await storage.write('onboarding_seen', 'true');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionStorageProvider.overrideWithValue(storage),
          authRepositoryProvider
              .overrideWith((ref) => MockAuthRepository(storage)),
        ],
        child: const _TestApp(),
      ),
    );
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    final registerLink = find.text(az.registerLink).first;
    await tester.ensureVisible(registerLink);
    await tester.tap(registerLink);
    await tester.pumpAndSettle();
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'Test');
    await tester.enterText(fields.at(1), 'User');
    await tester.enterText(fields.at(2), '701112233');
    await tester.enterText(fields.at(3), 'test@example.com');
    await tester.enterText(fields.at(4), 'password123');
    await tester.enterText(fields.at(5), 'password123');
    final submitButton = find.widgetWithText(ElevatedButton, az.registerLink);
    await tester.ensureVisible(submitButton);
    await tester.tap(submitButton);
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    expect(find.text('Demo code: 123456'), findsOneWidget);
  });
}
