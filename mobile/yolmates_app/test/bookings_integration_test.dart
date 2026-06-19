import 'package:flutter_test/flutter_test.dart';

import 'package:yolmates_app/features/bookings/data/booking.dart';
import 'package:yolmates_app/features/bookings/data/booking_dto.dart';
import 'package:yolmates_app/features/bookings/data/booking_mapper.dart';
import 'package:yolmates_app/shared/data/ride_dto.dart';

void main() {
  group('BookingDto parsing', () {
    test('parses full backend response', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440000',
        'ride_id': '123e4567-e89b-12d3-a456-426614174000',
        'passenger_id': '789e0123-e89b-12d3-a456-426614174111',
        'seats_booked': 2,
        'selected_spots': ['front_right', 'back_middle'],
        'status': 'pending',
        'total_price': 30.00,
        'payment_deadline': '2024-06-20T12:00:00Z',
        'created_at': '2024-06-15T10:30:00Z',
        'ride': {
          'id': '123e4567-e89b-12d3-a456-426614174000',
          'driver_id': 'drv-1',
          'vehicle_id': 'veh-1',
          'departure_time': '2024-06-18T14:00:00Z',
          'total_seats': 4,
          'available_seats': 2,
          'price_per_seat': 15.00,
          'origin_city': 'Bakı',
          'destination_city': 'Gəncə',
          'status': 'active',
          'smoking_allowed': false,
          'pets_allowed': false,
          'music_allowed': true,
          'female_only': false,
          'created_at': '2024-06-10T08:00:00Z',
          'driver': {
            'id': 'drv-1',
            'first_name': 'Rəşad',
            'last_name': 'Süleymanov',
            'phone': '+994501234567',
            'rating': 4.9,
            'total_rides': 120,
          },
        },
      };

      final dto = BookingDto.fromJson(json);

      expect(dto.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(dto.rideId, '123e4567-e89b-12d3-a456-426614174000');
      expect(dto.seatsBooked, 2);
      expect(dto.selectedSpots, ['front_right', 'back_middle']);
      expect(dto.status, 'pending');
      expect(dto.totalPrice, 30.00);
      expect(dto.paymentDeadline, isNotNull);
      expect(dto.ride, isNotNull);
      expect(dto.ride!.originCity, 'Bakı');
      expect(dto.ride!.driver, isNotNull);
      expect(dto.ride!.driver!.fullName, 'Rəşad Süleymanov');
    });

    test('parses decimal as string', () {
      final json = {
        'id': '1',
        'ride_id': '2',
        'passenger_id': '3',
        'seats_booked': 1,
        'status': 'pending',
        'total_price': '12.50',
        'created_at': '2024-06-15T10:30:00Z',
      };

      final dto = BookingDto.fromJson(json);
      expect(dto.totalPrice, 12.50);
    });

    test('handles missing payment_deadline', () {
      final json = {
        'id': '1',
        'ride_id': '2',
        'passenger_id': '3',
        'seats_booked': 1,
        'status': 'pending',
        'total_price': 10.0,
        'payment_deadline': null,
        'created_at': '2024-06-15T10:30:00Z',
      };

      final dto = BookingDto.fromJson(json);
      expect(dto.paymentDeadline, isNull);
    });

    test('keeps missing total_price nullable for price-per-seat fallback', () {
      final json = {
        'id': '1',
        'ride_id': '2',
        'passenger_id': '3',
        'seats_booked': 2,
        'status': 'pending',
        'total_price': null,
        'created_at': '2024-06-15T10:30:00Z',
      };

      expect(BookingDto.fromJson(json).totalPrice, isNull);
    });

    test('handles missing nested ride', () {
      final json = {
        'id': '1',
        'ride_id': '2',
        'passenger_id': '3',
        'seats_booked': 1,
        'status': 'pending',
        'total_price': 10.0,
        'created_at': '2024-06-15T10:30:00Z',
        'ride': null,
      };

      final dto = BookingDto.fromJson(json);
      expect(dto.ride, isNull);
    });
  });

  group('BookingMapper', () {
    test('maps dto with ride to Booking', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 2,
        status: 'pending',
        totalPrice: 30.00,
        createdAt: DateTime(2024, 6, 15, 10, 30),
        ride: RideDto(
          id: '2',
          driverId: 'drv-1',
          vehicleId: 'veh-1',
          departureTime: DateTime(2024, 6, 18, 14, 0),
          totalSeats: 4,
          availableSeats: 2,
          pricePerSeat: 15.00,
          originCity: 'Bakı',
          destinationCity: 'Gəncə',
          status: 'active',
          smokingAllowed: false,
          petsAllowed: false,
          musicAllowed: true,
          femaleOnly: false,
          createdAt: DateTime(2024, 6, 10),
          driver: const DriverDto(
            id: 'drv-1',
            firstName: 'Rəşad',
            lastName: 'Süleymanov',
            phone: '+994501234567',
            rating: 4.9,
            totalRides: 120,
          ),
        ),
      );

      final booking = BookingMapper.toBooking(dto);

      expect(booking.id, '1');
      expect(booking.rideId, '2');
      expect(booking.fromCity, 'Bakı');
      expect(booking.toCity, 'Gəncə');
      expect(booking.driverName, 'Rəşad Süleymanov');
      expect(booking.seats, 2);
      expect(booking.selectedSpots, isEmpty);
      expect(booking.pricePerSeat, 15.00);
      expect(booking.total, 30.00);
      expect(booking.status, BookingStatus.pending);
    });

    test('maps dto without ride to safe defaults', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 1,
        status: 'pending',
        totalPrice: 10.00,
        createdAt: DateTime(2024, 6, 15),
        ride: null,
      );

      final booking = BookingMapper.toBooking(dto);

      expect(booking.fromCity, '');
      expect(booking.toCity, '');
      expect(booking.driverName, 'Sürücü');
      expect(booking.pricePerSeat, 0.0);
    });

    test('maps status "accepted" to confirmed', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 1,
        status: 'accepted',
        totalPrice: 10.00,
        createdAt: DateTime(2024, 6, 15),
      );

      final booking = BookingMapper.toBooking(dto);
      expect(booking.status, BookingStatus.confirmed);
    });

    test('maps status "cancelled" correctly', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 1,
        status: 'cancelled',
        totalPrice: 10.00,
        createdAt: DateTime(2024, 6, 15),
      );

      final booking = BookingMapper.toBooking(dto);
      expect(booking.status, BookingStatus.cancelled);
    });

    for (final entry in {
      'boarded': BookingStatus.boarded,
      'no_show': BookingStatus.noShow,
      'expired': BookingStatus.expired,
    }.entries) {
      test('maps status "${entry.key}" correctly', () {
        final dto = BookingDto(
          id: '1',
          rideId: '2',
          passengerId: '3',
          seatsBooked: 1,
          status: entry.key,
          totalPrice: 10.00,
          createdAt: DateTime(2024, 6, 15),
        );

        expect(BookingMapper.toBooking(dto).status, entry.value);
      });
    }

    test('uses backend total price as canonical booking total', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 2,
        status: 'pending',
        totalPrice: 19.99,
        createdAt: DateTime(2024, 6, 15),
        ride: RideDto(
          id: '2',
          driverId: 'drv-1',
          vehicleId: 'veh-1',
          departureTime: DateTime(2024, 6, 18),
          totalSeats: 4,
          availableSeats: 2,
          pricePerSeat: 10,
          originCity: 'Bakı',
          destinationCity: 'Gəncə',
          status: 'active',
          smokingAllowed: false,
          petsAllowed: false,
          musicAllowed: true,
          femaleOnly: false,
          createdAt: DateTime(2024, 6, 10),
        ),
      );

      expect(BookingMapper.toBooking(dto).total, 19.99);
    });

    test('maps unknown status to pending fallback', () {
      final dto = BookingDto(
        id: '1',
        rideId: '2',
        passengerId: '3',
        seatsBooked: 1,
        status: 'unknown_status',
        totalPrice: 10.00,
        createdAt: DateTime(2024, 6, 15),
      );

      final booking = BookingMapper.toBooking(dto);
      expect(booking.status, BookingStatus.pending);
    });
  });
}
