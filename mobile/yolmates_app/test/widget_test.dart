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
  // Bootstrap is async; pump a few frames past the mock latency.
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
  testWidgets('fresh launch lands on the phone login screen', (tester) async {
    await _pumpApp(tester);

    // Login screen copy / CTA.
    expect(find.text('Daxil ol'), findsOneWidget);
    expect(find.text('Kod göndər'), findsOneWidget);
  });

  testWidgets('login validates an empty phone number', (tester) async {
    await _pumpApp(tester);

    await tester.tap(find.text('Kod göndər'));
    await tester.pump();

    expect(find.text('Nömrəni daxil edin'), findsOneWidget);
  });
}
