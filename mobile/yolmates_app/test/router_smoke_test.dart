import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/app/app.dart';
import 'package:yolmates_app/app/router.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('redirects protected route to login when unauthenticated', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[
          inMemoryStorageOverride(),
          routerInitialLocationProvider.overrideWith((ref) => '/bookings'),
        ],
        child: const YolmatesApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Daxil ol'), findsOneWidget);
  });
}
