import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/driver/data/driver_controller.dart';
import 'package:yolmates_app/features/driver/data/driver_ride.dart';

void main() {
  late ApiDriverRepository repository;
  late DioAdapter adapter;

  setUp(() {
    final client = ApiClient(
      AuthTokenStorage(InMemorySessionStorage()),
    );
    adapter = DioAdapter(dio: client.dio);
    repository = ApiDriverRepository(client);
  });

  test('publish sends the explicitly selected vehicle_id', () async {
    final departure = DateTime.utc(2026, 6, 21, 8);
    final payload = {
      'vehicle_id': 'vehicle-2',
      'origin_city': 'Baku',
      'destination_city': 'Ganja',
      'departure_time': departure.toIso8601String(),
      'total_seats': 2,
      'available_seats': 2,
      'available_spots': ['front_right', 'back_left'],
      'price_per_seat': 15.0,
      'description': null,
      'smoking_allowed': false,
      'music_allowed': true,
      'origin': {'lat': 40.4093, 'lon': 49.8671},
      'destination': {'lat': 40.4093, 'lon': 49.8671},
    };

    adapter.onPost(
      '/rides',
      (server) => server.reply(200, _rideResponse(departure)),
      data: payload,
    );

    final created = await repository.publishRide(
      DriverRide(
        id: 'local-ride',
        vehicleId: 'vehicle-2',
        fromCity: 'Baku',
        toCity: 'Ganja',
        departureTime: departure,
        seats: 2,
        pricePerSeat: 15,
      ),
    );

    expect(created.vehicleId, 'vehicle-2');
  });

  test('set default and deactivate call their vehicle endpoints', () async {
    adapter.onPatch(
      '/vehicles/vehicle-2/default',
      (server) => server.reply(
        200,
        _vehicleResponse(isActive: true, isDefault: true),
      ),
    );
    adapter.onPatch(
      '/vehicles/vehicle-2/deactivate',
      (server) => server.reply(
        200,
        _vehicleResponse(isActive: false, isDefault: false),
      ),
    );

    final defaultVehicle = await repository.setDefaultVehicle('vehicle-2');
    final inactiveVehicle = await repository.deactivateVehicle('vehicle-2');

    expect(defaultVehicle.isDefault, isTrue);
    expect(defaultVehicle.isActive, isTrue);
    expect(inactiveVehicle.isDefault, isFalse);
    expect(inactiveVehicle.isActive, isFalse);
  });
}

Map<String, dynamic> _rideResponse(DateTime departure) {
  return {
    'id': 'ride-1',
    'driver_id': 'driver-1',
    'vehicle_id': 'vehicle-2',
    'departure_time': departure.toIso8601String(),
    'total_seats': 2,
    'available_seats': 2,
    'price_per_seat': 15,
    'origin_city': 'Baku',
    'destination_city': 'Ganja',
    'status': 'active',
    'smoking_allowed': false,
    'pets_allowed': false,
    'music_allowed': true,
    'female_only': false,
    'created_at': DateTime.utc(2026, 6, 19).toIso8601String(),
  };
}

Map<String, dynamic> _vehicleResponse({
  required bool isActive,
  required bool isDefault,
}) {
  return {
    'id': 'vehicle-2',
    'brand': 'Toyota',
    'model': 'Prius',
    'year': 2022,
    'color': 'White',
    'plate_number': '90-AA-002',
    'seats_count': 4,
    'is_active': isActive,
    'is_default': isDefault,
  };
}
