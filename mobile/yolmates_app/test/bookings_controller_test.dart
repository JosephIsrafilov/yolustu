import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/bookings/data/booking.dart';
import 'package:yolmates_app/features/bookings/data/bookings_controller.dart';

Booking _booking({
  required String id,
  required DateTime createdAt,
  BookingStatus status = BookingStatus.pending,
}) {
  return Booking(
    id: id,
    rideId: 'ride-$id',
    fromCity: 'Baku',
    toCity: 'Ganja',
    driverName: 'Driver $id',
    departureTime: createdAt.add(const Duration(days: 1)),
    seats: 1,
    pricePerSeat: 10,
    status: status,
    createdAt: createdAt,
  );
}

class _FakeBookingsRepository implements BookingsRepository {
  _FakeBookingsRepository(this._store);

  final List<Booking> _store;

  @override
  Future<List<Booking>> all() async {
    final sorted = [..._store]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sorted;
  }

  @override
  Future<Booking> create(Booking booking) async {
    _store.add(booking);
    return booking;
  }

  @override
  Future<Booking> updateStatus(String id, BookingStatus status) async {
    final index = _store.indexWhere((booking) => booking.id == id);
    if (index == -1) throw StateError('missing booking');
    _store[index] = _store[index].copyWith(status: status);
    return _store[index];
  }
}

void main() {
  group('BookingsController', () {
    test('loads sorted bookings and finds items by id', () async {
      final repo = _FakeBookingsRepository([
        _booking(id: 'old', createdAt: DateTime(2024, 1, 1)),
        _booking(id: 'new', createdAt: DateTime(2024, 1, 2)),
      ]);
      final container = ProviderContainer(
        overrides: [bookingsRepositoryProvider.overrideWithValue(repo)],
      );
      addTearDown(container.dispose);

      final bookings = await container.read(bookingsControllerProvider.future);

      expect(bookings.map((booking) => booking.id), ['new', 'old']);
      expect(
        container.read(bookingsControllerProvider.notifier).byId('old')?.id,
        'old',
      );
    });

    test('createBooking and setStatus keep state in sync', () async {
      final repo = _FakeBookingsRepository([]);
      final container = ProviderContainer(
        overrides: [bookingsRepositoryProvider.overrideWithValue(repo)],
      );
      addTearDown(container.dispose);

      await container.read(bookingsControllerProvider.future);

      final created = await container
          .read(bookingsControllerProvider.notifier)
          .createBooking(
            _booking(id: 'b1', createdAt: DateTime(2024, 1, 3)),
          );
      expect(created.id, 'b1');
      expect(container.read(bookingsControllerProvider).value, hasLength(1));

      final updated = await container
          .read(bookingsControllerProvider.notifier)
          .setStatus('b1', BookingStatus.confirmed);

      expect(updated.status, BookingStatus.confirmed);
      expect(
        container.read(bookingsControllerProvider.notifier).byId('b1')?.status,
        BookingStatus.confirmed,
      );
    });
  });
}
