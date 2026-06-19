import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/network/api_exception.dart';
import 'package:yolmates_app/core/repositories/rides_repository.dart';
import 'package:yolmates_app/features/bookings/booking_confirm_screen.dart';
import 'package:yolmates_app/features/bookings/booking_detail_screen.dart';
import 'package:yolmates_app/features/bookings/data/booking.dart';
import 'package:yolmates_app/features/bookings/data/bookings_controller.dart';
import 'package:yolmates_app/shared/models/trip.dart';
import 'package:yolmates_app/shared/models/user.dart';

Trip _ride({List<String>? availableSpots}) {
  return Trip(
    id: 'ride-1',
    driver: const User(
      id: 'driver-1',
      name: 'Driver',
      phone: '',
      rating: 4.9,
      tripCount: 20,
    ),
    fromCity: 'Bakı',
    toCity: 'Gəncə',
    departureTime: DateTime(2026, 6, 20, 10),
    price: 15,
    availableSeats: availableSpots?.length ?? 4,
    totalSeats: 4,
    availableSpots: availableSpots ??
        const ['front_right', 'back_left', 'back_middle', 'back_right'],
    status: 'active',
  );
}

class _RidesRepository implements RidesRepository {
  int detailCalls = 0;

  @override
  Future<Trip?> rideById(String id) async {
    detailCalls++;
    return detailCalls == 1
        ? _ride()
        : _ride(
            availableSpots: const [
              'back_left',
              'back_middle',
              'back_right',
            ],
          );
  }

  @override
  Future<List<Trip>> search({
    required String fromCity,
    required String toCity,
    DateTime? date,
    DateTime? dateTo,
    int passengers = 1,
  }) async =>
      [];
}

class _BookingsRepository implements BookingsRepository {
  _BookingsRepository({this.bookings = const [], this.createError});

  final List<Booking> bookings;
  final Object? createError;

  @override
  Future<List<Booking>> all() async => bookings;

  @override
  Future<Booking> create(Booking booking) async {
    if (createError != null) throw createError!;
    return booking;
  }

  @override
  Future<Booking> updateStatus(String id, BookingStatus status) async {
    throw UnimplementedError();
  }
}

void main() {
  testWidgets('confirm stays disabled until exact seat selection is valid',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ridesRepositoryProvider.overrideWithValue(_RidesRepository()),
          bookingsRepositoryProvider.overrideWithValue(_BookingsRepository()),
        ],
        child: const MaterialApp(
          home: BookingConfirmScreen(rideId: 'ride-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    ElevatedButton confirmButton() => tester.widget<ElevatedButton>(
          find.widgetWithText(ElevatedButton, 'Təsdiqlə'),
        );

    expect(confirmButton().onPressed, isNull);
    expect(find.text('15 AZN'), findsOneWidget);

    await tester.tap(find.text('Arxa sol'));
    await tester.pump();

    expect(confirmButton().onPressed, isNotNull);

    await tester.drag(find.byType(ListView), const Offset(0, -600));
    await tester.pump();
    expect(find.text('15.00 AZN'), findsNWidgets(2));
    expect(find.textContaining('10%'), findsNothing);
  });

  testWidgets('stale selected seat refreshes ride and invalidates confirmation',
      (tester) async {
    final rides = _RidesRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ridesRepositoryProvider.overrideWithValue(rides),
          bookingsRepositoryProvider.overrideWithValue(
            _BookingsRepository(
              createError: const ApiException(
                statusCode: 400,
                code: 'BAD_REQUEST',
                message: 'Selected seat is not available',
              ),
            ),
          ),
        ],
        child: const MaterialApp(
          home: BookingConfirmScreen(rideId: 'ride-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ön sağ'));
    await tester.pump();
    await tester.tap(find.widgetWithText(ElevatedButton, 'Təsdiqlə'));
    await tester.pumpAndSettle();

    expect(rides.detailCalls, 2);
    await tester.drag(find.byType(ListView), const Offset(0, -800));
    await tester.pump();
    expect(find.textContaining('Yerlər yeniləndi'), findsOneWidget);
    final confirm = tester.widget<ElevatedButton>(
      find.widgetWithText(ElevatedButton, 'Təsdiqlə'),
    );
    expect(confirm.onPressed, isNull);
  });

  testWidgets('booking details show selected seat labels and backend total',
      (tester) async {
    final booking = Booking(
      id: 'booking-1',
      rideId: 'ride-1',
      driverId: 'driver-1',
      fromCity: 'Bakı',
      toCity: 'Gəncə',
      driverName: 'Driver',
      departureTime: DateTime(2026, 6, 20, 10),
      seats: 2,
      selectedSpots: const ['front_right', 'back_middle'],
      pricePerSeat: 15,
      totalPrice: 29.99,
      status: BookingStatus.pending,
      createdAt: DateTime(2026, 6, 19),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          bookingsRepositoryProvider.overrideWithValue(
            _BookingsRepository(bookings: [booking]),
          ),
        ],
        child: const MaterialApp(
          home: BookingDetailScreen(bookingId: 'booking-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ön sağ, Arxa orta'), findsOneWidget);
    expect(find.text('29.99 AZN'), findsOneWidget);
  });
}
