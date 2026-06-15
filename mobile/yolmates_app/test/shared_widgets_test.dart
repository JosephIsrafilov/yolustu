import 'dart:ui' show SemanticsAction;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/theme.dart';
import 'package:yolmates_app/shared/widgets/app_card.dart';
import 'package:yolmates_app/shared/widgets/empty_state.dart';
import 'package:yolmates_app/shared/widgets/status_badge.dart';

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

  group('goldens', () {
    testWidgets('shared widgets light theme', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(420, 900);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _wrap(
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AppCard(
                  padding: const EdgeInsets.all(16),
                  child: const SizedBox(
                    width: 220,
                    child: Text('Card content'),
                  ),
                ),
                const SizedBox(height: 16),
                const StatusBadge(
                  label: 'Confirmed',
                  backgroundColor: Color(0x1A14B8A6),
                  foregroundColor: AppTheme.tealDark,
                ),
                const SizedBox(height: 24),
                EmptyState(
                  icon: Icons.search_off,
                  title: 'No trips found',
                  message: 'Try changing your route or date.',
                  actionLabel: 'Change search',
                  onAction: () {},
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pump();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/shared_widgets_light.png'),
      );
    });

    testWidgets('shared widgets dark theme', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(320, 220);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        _wrap(
          AppCard(
            padding: const EdgeInsets.all(16),
            child: const SizedBox(
              width: 220,
              child: Text('Dark card'),
            ),
          ),
          theme: ThemeData(
            brightness: Brightness.dark,
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppTheme.teal,
              brightness: Brightness.dark,
            ),
          ),
        ),
      );
      await tester.pump();

      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/shared_widgets_dark.png'),
      );
    });
  });

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
            child: const SizedBox(width: 120, height: 60, child: Text('Tap me')),
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
