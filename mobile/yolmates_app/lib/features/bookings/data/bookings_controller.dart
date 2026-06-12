import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'booking.dart';

/// Bookings store contract. Backend swap point.
///
/// In-memory mock now; a real implementation calls the bookings API and the
/// UI (which only depends on [bookingsControllerProvider]) stays unchanged.
abstract class BookingsRepository {
  Future<List<Booking>> all();
  Future<Booking> create(Booking booking);
  Future<Booking> updateStatus(String id, BookingStatus status);
}

class MockBookingsRepository implements BookingsRepository {
  static const Duration _latency = Duration(milliseconds: 600);

  // Starts empty so the reservations empty-state is exercised on a fresh login.
  final List<Booking> _store = [];

  @override
  Future<List<Booking>> all() async {
    await Future.delayed(_latency);
    final sorted = [..._store]
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sorted;
  }

  @override
  Future<Booking> create(Booking booking) async {
    await Future.delayed(_latency);
    _store.add(booking);
    return booking;
  }

  @override
  Future<Booking> updateStatus(String id, BookingStatus status) async {
    await Future.delayed(_latency);
    final i = _store.indexWhere((b) => b.id == id);
    if (i == -1) {
      throw StateError('Booking $id not found');
    }
    final updated = _store[i].copyWith(status: status);
    _store[i] = updated;
    return updated;
  }
}

// --- Providers ---------------------------------------------------------------

final bookingsRepositoryProvider = Provider<BookingsRepository>(
  (ref) => MockBookingsRepository(),
);

/// Reactive list of the current user's bookings.
final bookingsControllerProvider =
    AsyncNotifierProvider<BookingsController, List<Booking>>(
  BookingsController.new,
);

class BookingsController extends AsyncNotifier<List<Booking>> {
  BookingsRepository get _repo => ref.read(bookingsRepositoryProvider);

  @override
  Future<List<Booking>> build() => _repo.all();

  /// Create a booking and refresh the list. Returns the created booking.
  Future<Booking> createBooking(Booking booking) async {
    final created = await _repo.create(booking);
    state = AsyncData(await _repo.all());
    return created;
  }

  /// Transition a booking's status (cancel / pay) and refresh.
  Future<Booking> setStatus(String id, BookingStatus status) async {
    final updated = await _repo.updateStatus(id, status);
    state = AsyncData(await _repo.all());
    return updated;
  }

  Booking? byId(String id) {
    final list = state.valueOrNull;
    if (list == null) return null;
    for (final b in list) {
      if (b.id == id) return b;
    }
    return null;
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = AsyncData(await _repo.all());
  }
}
