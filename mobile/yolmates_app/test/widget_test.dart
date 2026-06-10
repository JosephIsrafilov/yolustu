import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const YolmatesApp());
    await tester.pumpAndSettle();

    // Verify that the home screen is shown by checking for 'Yolmates' text.
    expect(find.text('Yolmates'), findsWidgets);
  });
}
