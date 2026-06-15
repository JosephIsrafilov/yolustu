import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
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
      await _pumpApp(tester);

      expect(find.text('Səyahət xərclərini azaldın'), findsOneWidget);
      expect(find.text('Keç'), findsNWidgets(2));

      await tester.tap(find.text('Keç').first);
      await tester.pumpAndSettle();

      expect(find.text('Yolüstü'), findsOneWidget);
      expect(find.text('Qeydiyyatdan keç'), findsOneWidget);

      await tester.tap(find.text('Daxil ol'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Telefon nömrənizi daxil edin, sizə təsdiq kodu göndərək.',
        ),
        findsOneWidget,
      );
      expect(find.text('Kod göndər'), findsOneWidget);
    },
  );

  testWidgets('login validates an empty phone number', (tester) async {
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

    await tester.tap(find.text('Daxil ol'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Kod göndər'));
    await tester.pump();

    expect(find.text('Nömrəni daxil edin'), findsOneWidget);
  });
}
