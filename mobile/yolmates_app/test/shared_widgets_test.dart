import 'dart:ui' show SemanticsAction;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/theme.dart';
import 'package:yolmates_app/shared/widgets/app_card.dart';
import 'package:yolmates_app/shared/widgets/empty_state.dart';

Widget _wrap(Widget child, {ThemeData? theme}) {
  return MaterialApp(
    theme: theme ??
        ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: AppTheme.teal),
        ),
    home: Scaffold(body: Center(child: child)),
    debugShowCheckedModeBanner: false,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('accessibility', () {
    testWidgets('empty state action keeps a 48px tap target', (tester) async {
      await tester.pumpWidget(
        _wrap(
          EmptyState(
            icon: Icons.info_outline,
            title: 'Nothing here',
            message: 'Use the action button below.',
            actionLabel: 'Retry',
            onAction: () {},
          ),
        ),
      );

      final buttonSize = tester.getSize(find.byType(OutlinedButton));
      expect(buttonSize.height, greaterThanOrEqualTo(48));
    });

    testWidgets('tappable card exposes tap semantics', (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(
        _wrap(
          AppCard(
            onTap: () {},
            child:
                const SizedBox(width: 120, height: 60, child: Text('Tap me')),
          ),
        ),
      );

      final semantics = tester.getSemantics(find.text('Tap me'));
      final semanticsData = semantics.getSemanticsData();
      expect(
        semanticsData.label,
        'Tap me',
      );
      expect(semanticsData.hasAction(SemanticsAction.tap), isTrue);
      handle.dispose();
    });
  });
}
