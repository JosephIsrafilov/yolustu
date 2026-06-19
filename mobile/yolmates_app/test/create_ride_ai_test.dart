import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/driver/create_ride_screen.dart';
import 'package:yolmates_app/features/driver/data/ai_pricing_repository.dart';
import 'package:yolmates_app/features/driver/data/driver_controller.dart';
import 'package:yolmates_app/features/driver/data/driver_ride.dart';
import 'package:yolmates_app/features/driver/data/vehicle.dart';

class MockAiPricingRepository implements AiPricingRepository {
  bool failNext = false;

  @override
  Future<PricingSuggestionResponse> getSuggestion(
      PricingSuggestionRequest request) async {
    if (failNext) {
      throw Exception('Mock failure');
    }
    return PricingSuggestionResponse(
        suggestedPrice: 20, reasoning: 'Mock AI reasoning');
  }
}

void main() {
  testWidgets('CreateRideScreen shows AI button and fetches price',
      (WidgetTester tester) async {
    final mockRepo = MockAiPricingRepository();

    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          aiPricingRepositoryProvider.overrideWithValue(mockRepo),
          driverRepositoryProvider.overrideWithValue(
            _VehicleDriverRepository(),
          ),
        ],
        child: const MaterialApp(
          home: CreateRideScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Initial state: Button visible, no suggestion
    expect(find.text('Təklif al'), findsOneWidget);
    expect(find.text('Təklif olunan qiymət: 20 AZN'), findsNothing);

    // Tap the button
    await tester.ensureVisible(find.text('Təklif al'));
    await tester.tap(find.text('Təklif al'));

    // Finish loading
    await tester.pumpAndSettle();

    // Expect suggestion UI
    expect(find.text('Təklif olunan qiymət: 20 AZN'), findsOneWidget);
    expect(find.text('Mock AI reasoning'), findsOneWidget);
    expect(find.text('Bu qiyməti istifadə et'), findsOneWidget);

    // Use the suggestion
    await tester.tap(find.text('Bu qiyməti istifadə et'));
    await tester.pumpAndSettle();

    // Verify price text field is filled
    expect(find.text('20'), findsOneWidget);
  });

  testWidgets('CreateRideScreen handles AI error gracefully',
      (WidgetTester tester) async {
    final mockRepo = MockAiPricingRepository()..failNext = true;

    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          aiPricingRepositoryProvider.overrideWithValue(mockRepo),
          driverRepositoryProvider.overrideWithValue(
            _VehicleDriverRepository(),
          ),
        ],
        child: const MaterialApp(
          home: CreateRideScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Təklif al'));
    await tester.tap(find.text('Təklif al'));
    await tester.pumpAndSettle();

    // Expect error state
    expect(find.text('Qiymət təklifi alınmadı'), findsOneWidget);
    expect(find.text('Yenidən cəhd et'), findsOneWidget);

    // App shouldn't crash
    expect(find.byType(CreateRideScreen), findsOneWidget);
  });
}

class _VehicleDriverRepository implements DriverRepository {
  static const vehicle = Vehicle(
    id: 'vehicle-1',
    brand: 'Toyota',
    model: 'Prius',
    year: 2022,
    color: 'White',
    plate: '90-AA-001',
    seats: 4,
    isDefault: true,
  );

  @override
  Future<List<Vehicle>> vehicles() async => [vehicle];

  @override
  Future<List<DriverRide>> rides() async => [];

  @override
  Future<DriverRide> publishRide(DriverRide ride) async => ride;

  @override
  Future<Vehicle> saveVehicle(Vehicle vehicle) async => vehicle;

  @override
  Future<Vehicle> setDefaultVehicle(String id) async => vehicle;

  @override
  Future<Vehicle> deactivateVehicle(String id) async => vehicle;

  @override
  Future<void> deleteVehicle(String id) async {}

  @override
  Future<void> uploadVehicleDocument(
      String id, String documentType, String filePath) async {}

  @override
  Future<DriverRide> updateRideStatus(
    String id,
    DriverRideStatus status,
  ) {
    throw UnimplementedError();
  }
}
