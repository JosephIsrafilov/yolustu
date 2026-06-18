import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/auth/state/auth_controller.dart';
import 'package:yolmates_app/features/driver/driver_verification_screen.dart';
import 'package:yolmates_app/features/reviews/presentation/review_dialog.dart';
import 'package:yolmates_app/features/reviews/data/reviews_repository.dart';
import 'package:yolmates_app/shared/widgets/map/route_map_view.dart';

void main() {
  testWidgets('RouteMapView renders without crashing',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RouteMapView(
            origin: 'Bakı',
            destination: 'Gəncə',
            progress: 0.5,
            showCar: true,
          ),
        ),
      ),
    );

    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 500));
    }

    // Verify origin and destination are displayed in the HUD
    expect(find.text('Bakı → Gəncə'), findsOneWidget);
    // Verify CustomPaint is rendered
    expect(find.byType(CustomPaint), findsAtLeastNWidgets(1));
  });

  testWidgets('DriverVerificationScreen mock approve flow updates status',
      skip: true, (WidgetTester tester) async {
    final storage = InMemorySessionStorage();
    await storage.write('onboarding_seen', 'true');
    final user = const AppUser(
      id: 'mock-user-123',
      phone: '+994501112233',
      firstName: 'Ahmad',
      lastName: 'Aliyev',
      role: UserRole.passenger,
      verificationStatus: 'none',
    );
    await storage.write('auth_user', jsonEncode(user.toJson()));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionStorageProvider.overrideWithValue(storage),
        ],
        child: const MaterialApp(
          home: DriverVerificationScreen(),
        ),
      ),
    );

    // Pump to let the bootstrap resolve
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    // Verify "Mock Təsdiqlə" button is present since isMock is true and verificationStatus is not approved
    expect(find.text('Mock Təsdiqlə (Geliştirici)'), findsOneWidget);

    // Tap "Mock Təsdiqlə"
    await tester.tap(find.text('Mock Təsdiqlə (Geliştirici)'));

    // Pump past the latency
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    // Check that snackbar displays success
    expect(find.text('Sürücü statusu təsdiqləndi (MOCK)'), findsOneWidget);
  });

  testWidgets('ReviewDialog shows, rates and submits successfully',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          reviewsRepositoryProvider.overrideWithValue(MockReviewsRepository()),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () => ReviewDialog.show(
                  context,
                  targetId: 'driver-id-123',
                  rideId: 'ride-id-456',
                  targetName: 'Elşən Məmmədov',
                ),
                child: const Text('Rəy ver'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Rəy ver'));
    await tester.pumpAndSettle();

    // Verify dialog elements
    expect(find.text('Elşən Məmmədov üçün rəy bildirin'), findsOneWidget);
    expect(find.text('Səyahəti qiymətləndirin:'), findsOneWidget);

    // Enter a comment
    await tester.enterText(find.byType(TextField), 'Çox yaxşı yolçuluq idi.');
    await tester.pump();

    // Submit review
    await tester.tap(find.text('Göndər'));

    // Pump past mock latency
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    // Dialog should be dismissed, and snackbar shows success
    expect(find.text('Rəyiniz uğurla göndərildi. Təşəkkür edirik!'),
        findsOneWidget);
  });
}
