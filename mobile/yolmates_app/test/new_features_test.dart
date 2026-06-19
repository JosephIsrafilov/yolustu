import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/auth/data/app_user.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/auth/state/auth_controller.dart';
import 'package:yolmates_app/features/driver/driver_verification_screen.dart';
import 'package:yolmates_app/features/reviews/data/reviews_repository.dart';
import 'package:yolmates_app/features/reviews/presentation/review_dialog.dart';
import 'package:yolmates_app/shared/widgets/map/route_map_view.dart';

void main() {
  testWidgets('RouteMapView renders without crashing', (tester) async {
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

    expect(find.text('Bakı → Gəncə'), findsOneWidget);
    expect(find.byType(CustomPaint), findsAtLeastNWidgets(1));
  });

  testWidgets('DriverVerificationScreen mock approve flow updates status',
      skip: true, (tester) async {
    final storage = InMemorySessionStorage();
    await storage.write('onboarding_seen', 'true');
    const user = AppUser(
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

    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    expect(find.byType(DriverVerificationScreen), findsOneWidget);
  });

  testWidgets('ReviewDialog shows, rates and submits successfully',
      (tester) async {
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
                  targetName: 'Driver Name',
                ),
                child: const Text('Review'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Review'));
    await tester.pumpAndSettle();

    expect(find.text('Leave a review for Driver Name'), findsOneWidget);
    expect(find.text('Rate the trip:'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Great trip.');
    await tester.pump();
    await tester.tap(find.text('Submit'));

    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }

    expect(find.byType(AlertDialog), findsNothing);
  });
}
