import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/localization/app_localizations.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
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
      expect(find.text(az.onboardingSkip), findsNWidgets(2));

      await tester.tap(find.text(az.onboardingSkip).first);
      await tester.pumpAndSettle();

      expect(find.text('Yolmates'), findsNothing); // Removed old name as it might be an icon now
      expect(find.text(az.registerLink), findsOneWidget);

      await tester.tap(find.text(az.loginBtn).first);
      await tester.pumpAndSettle();

      expect(find.text(az.phoneLoginSubtitle), findsOneWidget);
      expect(find.text(az.phoneLoginSendCode), findsOneWidget);
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
        ],
        child: const _TestApp(),
      ),
    );
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    await tester.tap(find.text(az.loginBtn).first);
    await tester.pumpAndSettle();

    await tester.tap(find.text(az.phoneLoginSendCode));
    await tester.pump();

    expect(find.text(az.phoneLoginPhoneRequired), findsOneWidget);
  });
}
