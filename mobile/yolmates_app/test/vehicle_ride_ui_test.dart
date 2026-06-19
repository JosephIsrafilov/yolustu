import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/driver/create_ride_screen.dart';
import 'package:yolmates_app/features/driver/data/driver_controller.dart';
import 'package:yolmates_app/features/driver/data/driver_ride.dart';
import 'package:yolmates_app/features/driver/data/vehicle.dart';

void main() {
  testWidgets('default active vehicle is selected and caps seats',
      (tester) async {
    final repository = _FakeDriverRepository([
      _vehicle(id: 'vehicle-1', seats: 4),
      _vehicle(id: 'vehicle-2', seats: 2, isDefault: true),
      _vehicle(id: 'vehicle-3', seats: 4, isActive: false),
    ]);

    await _pumpCreateRide(tester, repository);

    expect(find.text('Toyota Prius • 90-AA-002 • 2 yer'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(
      tester
          .widget<IconButton>(
            find.widgetWithIcon(IconButton, Icons.add_circle_outline),
          )
          .onPressed,
      isNull,
    );

    await tester.tap(find.byKey(const Key('ride-vehicle-selector')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Toyota Prius • 90-AA-001 • 4 yer').last);
    await tester.pumpAndSettle();

    final addButton = tester.widget<IconButton>(
      find.widgetWithIcon(IconButton, Icons.add_circle_outline),
    );
    expect(addButton.onPressed, isNotNull);
  });

  testWidgets('no active vehicle blocks publish and offers add path',
      (tester) async {
    final repository = _FakeDriverRepository([
      _vehicle(id: 'vehicle-1', seats: 4, isActive: false),
    ]);

    await _pumpCreateRide(tester, repository);

    expect(
      find.text('Gediş yaratmaq üçün aktiv avtomobil lazımdır.'),
      findsOneWidget,
    );
    expect(find.byKey(const Key('add-active-vehicle')), findsOneWidget);
    expect(
      tester
          .widget<ElevatedButton>(find.byKey(const Key('publish-ride')))
          .onPressed,
      isNull,
    );
  });
}

Future<void> _pumpCreateRide(
  WidgetTester tester,
  DriverRepository repository,
) async {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        driverRepositoryProvider.overrideWithValue(repository),
      ],
      child: const MaterialApp(home: CreateRideScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

Vehicle _vehicle({
  required String id,
  required int seats,
  bool isActive = true,
  bool isDefault = false,
}) {
  return Vehicle(
    id: id,
    brand: 'Toyota',
    model: 'Prius',
    year: 2022,
    color: 'White',
    plate: id == 'vehicle-1' ? '90-AA-001' : '90-AA-002',
    seats: seats,
    isActive: isActive,
    isDefault: isDefault,
  );
}

class _FakeDriverRepository implements DriverRepository {
  final List<Vehicle> _vehicles;

  _FakeDriverRepository(this._vehicles);

  @override
  Future<Vehicle> deactivateVehicle(String id) async {
    throw UnimplementedError();
  }

  @override
  Future<void> deleteVehicle(String id) async {
    throw UnimplementedError();
  }

  @override
  Future<void> uploadVehicleDocument(
      String id, String documentType, String filePath) async {}

  @override
  Future<List<DriverRide>> rides() async => [];

  @override
  Future<DriverRide> publishRide(DriverRide ride) async => ride;

  @override
  Future<Vehicle> saveVehicle(Vehicle vehicle) async {
    throw UnimplementedError();
  }

  @override
  Future<Vehicle> setDefaultVehicle(String id) async {
    throw UnimplementedError();
  }

  @override
  Future<DriverRide> updateRideStatus(
    String id,
    DriverRideStatus status,
  ) async {
    throw UnimplementedError();
  }

  @override
  Future<List<Vehicle>> vehicles() async => _vehicles;
}
