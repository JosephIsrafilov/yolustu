import 'package:flutter_test/flutter_test.dart';

import 'package:yolmates_app/shared/data/city_coordinates.dart';
import 'package:yolmates_app/shared/data/ride_dto.dart';
import 'package:yolmates_app/shared/data/ride_mapper.dart';

void main() {
  group('RideDto parsing', () {
    test('parses full backend response', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440000',
        'driver_id': '123e4567-e89b-12d3-a456-426614174000',
        'vehicle_id': '789e0123-e89b-12d3-a456-426614174111',
        'departure_time': '2024-06-15T10:30:00Z',
        'total_seats': 4,
        'available_seats': 2,
        'price_per_seat': 15.50,
        'origin_city': 'Bakı',
        'destination_city': 'Gəncə',
        'intermediate_cities': null,
        'status': 'active',
        'description': 'Test ride',
        'smoking_allowed': false,
        'pets_allowed': false,
        'music_allowed': true,
        'female_only': false,
        'created_at': '2024-06-10T08:00:00Z',
        'driver': {
          'id': '123e4567-e89b-12d3-a456-426614174000',
          'first_name': 'Murad',
          'last_name': 'Qasımov',
          'phone': '+994501234567',
          'avatar_url': null,
          'rating': 4.8,
          'total_rides': 50,
        },
        'vehicle': null,
      };

      final dto = RideDto.fromJson(json);

      expect(dto.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(dto.originCity, 'Bakı');
      expect(dto.destinationCity, 'Gəncə');
      expect(dto.pricePerSeat, 15.50);
      expect(dto.availableSeats, 2);
      expect(dto.totalSeats, 4);
      expect(dto.status, 'active');
      expect(dto.driver, isNotNull);
      expect(dto.driver!.fullName, 'Murad Qasımov');
      expect(dto.driver!.rating, 4.8);
      expect(dto.driver!.totalRides, 50);
    });

    test('parses decimal as string', () {
      final json = {
        'id': '1',
        'driver_id': '2',
        'vehicle_id': '3',
        'departure_time': '2024-06-15T10:30:00Z',
        'total_seats': 4,
        'available_seats': 2,
        'price_per_seat': '12.75',
        'origin_city': 'Bakı',
        'destination_city': 'Gəncə',
        'status': 'active',
        'created_at': '2024-06-10T08:00:00Z',
      };

      final dto = RideDto.fromJson(json);
      expect(dto.pricePerSeat, 12.75);
    });

    test('handles missing driver', () {
      final json = {
        'id': '1',
        'driver_id': '2',
        'vehicle_id': '3',
        'departure_time': '2024-06-15T10:30:00Z',
        'total_seats': 4,
        'available_seats': 2,
        'price_per_seat': 10,
        'origin_city': 'Bakı',
        'destination_city': 'Gəncə',
        'status': 'active',
        'created_at': '2024-06-10T08:00:00Z',
        'driver': null,
      };

      final dto = RideDto.fromJson(json);
      expect(dto.driver, isNull);
    });

    test('handles unknown status safely', () {
      final json = {
        'id': '1',
        'driver_id': '2',
        'vehicle_id': '3',
        'departure_time': '2024-06-15T10:30:00Z',
        'total_seats': 4,
        'available_seats': 2,
        'price_per_seat': 10,
        'origin_city': 'Bakı',
        'destination_city': 'Gəncə',
        'status': 'unknown_status',
        'created_at': '2024-06-10T08:00:00Z',
      };

      final dto = RideDto.fromJson(json);
      expect(dto.status, 'unknown_status');
    });
  });

  group('RideMapper', () {
    test('maps dto to Trip with driver', () {
      final dto = RideDto(
        id: '1',
        driverId: '2',
        vehicleId: '3',
        departureTime: DateTime(2024, 6, 15, 10, 30),
        totalSeats: 4,
        availableSeats: 2,
        pricePerSeat: 15.50,
        originCity: 'Bakı',
        destinationCity: 'Gəncə',
        status: 'active',
        smokingAllowed: false,
        petsAllowed: false,
        musicAllowed: true,
        femaleOnly: false,
        createdAt: DateTime(2024, 6, 10),
        driver: const DriverDto(
          id: '2',
          firstName: 'Rəşad',
          lastName: 'Süleymanov',
          phone: '+994501234567',
          rating: 4.9,
          totalRides: 120,
        ),
      );

      final trip = RideMapper.toTrip(dto);

      expect(trip.id, '1');
      expect(trip.fromCity, 'Bakı');
      expect(trip.toCity, 'Gəncə');
      expect(trip.price, 15.50);
      expect(trip.availableSeats, 2);
      expect(trip.driver.name, 'Rəşad Süleymanov');
      expect(trip.driver.rating, 4.9);
      expect(trip.driver.tripCount, 120);
    });

    test('maps dto without driver to safe defaults', () {
      final dto = RideDto(
        id: '1',
        driverId: '2',
        vehicleId: '3',
        departureTime: DateTime(2024, 6, 15, 10, 30),
        totalSeats: 4,
        availableSeats: 2,
        pricePerSeat: 15.50,
        originCity: 'Bakı',
        destinationCity: 'Gəncə',
        status: 'active',
        smokingAllowed: false,
        petsAllowed: false,
        musicAllowed: true,
        femaleOnly: false,
        createdAt: DateTime(2024, 6, 10),
        driver: null,
      );

      final trip = RideMapper.toTrip(dto);

      expect(trip.driver.name, 'Sürücü');
      expect(trip.driver.rating, 0.0);
      expect(trip.driver.tripCount, 0);
    });
  });

  group('CityCoordinates', () {
    test('returns coordinates for known cities', () {
      final baku = CityCoordinates.get('Bakı');
      expect(baku, isNotNull);
      expect(baku!.lat, closeTo(40.4093, 0.01));
      expect(baku.lon, closeTo(49.8671, 0.01));

      final ganja = CityCoordinates.get('Gəncə');
      expect(ganja, isNotNull);
      expect(ganja!.lat, closeTo(40.6828, 0.01));
    });

    test('returns null for unknown cities', () {
      final unknown = CityCoordinates.get('UnknownCity');
      expect(unknown, isNull);
    });
  });
}
