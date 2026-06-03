import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/app/app.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('renders onboarding for unauthenticated user', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[inMemoryStorageOverride()],
        child: const YolmatesApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Daxil ol'), findsOneWidget);
    expect(find.text('Davam et'), findsOneWidget);
  });
}
