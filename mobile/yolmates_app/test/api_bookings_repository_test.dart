import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/bookings/data/api_bookings_repository.dart';
import 'package:yolmates_app/features/bookings/data/booking.dart';

void main() {
  test('create sends actual selected spots and matching count', () async {
    final client = ApiClient(
      AuthTokenStorage(InMemorySessionStorage()),
    );
    final adapter = DioAdapter(dio: client.dio);
    final repository = ApiBookingsRepository(client);
    final createdAt = DateTime(2026, 6, 19);

    adapter.onPost(
      '/bookings',
      (server) => server.reply(200, {
        'id': 'booking-1',
        'ride_id': 'ride-1',
        'passenger_id': 'passenger-1',
        'seats_booked': 2,
        'selected_spots': ['back_left', 'back_right'],
        'status': 'pending',
        'total_price': 30,
        'created_at': createdAt.toIso8601String(),
      }),
      data: {
        'ride_id': 'ride-1',
        'seats_booked': 2,
        'selected_spots': ['back_left', 'back_right'],
      },
    );

    final created = await repository.create(
      Booking(
        id: '',
        rideId: 'ride-1',
        fromCity: 'Bakı',
        toCity: 'Gəncə',
        driverName: 'Driver',
        departureTime: createdAt.add(const Duration(days: 1)),
        seats: 2,
        selectedSpots: const ['back_left', 'back_right'],
        pricePerSeat: 15,
        status: BookingStatus.pending,
        createdAt: createdAt,
      ),
    );

    expect(created.seats, 2);
    expect(created.selectedSpots, ['back_left', 'back_right']);
    expect(created.total, 30);
  });
}
