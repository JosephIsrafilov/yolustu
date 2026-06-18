import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'api_bookings_repository.dart';
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

/// Binds to real API or mock based on --dart-define=API_MODE.
final bookingsRepositoryProvider = Provider<BookingsRepository>(
  (ref) {
    if (AuthMode.isApi) {
      return ApiBookingsRepository(ref.read(apiClientProvider));
    } else {
      return MockBookingsRepository();
    }
  },
);

/// Exposes the count of active bookings (pending, confirmed, paid).
final activeBookingsCountProvider = Provider<int>((ref) {
  final bookings = ref.watch(bookingsControllerProvider).valueOrNull ?? [];
  return bookings.where((b) => b.status.isActive).length;
});

/// Reactive list of the current user's bookings.
final bookingsControllerProvider =
    AsyncNotifierProvider<BookingsController, List<Booking>>(
  BookingsController.new,
);

class BookingsController extends AsyncNotifier<List<Booking>> {
  BookingsRepository get _repo => ref.read(bookingsRepositoryProvider);

  List<Booking> _visible(List<Booking> bookings) {
    return bookings
        .where(
          (booking) =>
              booking.status != BookingStatus.cancelled &&
              booking.status != BookingStatus.rejected,
        )
        .toList();
  }

  @override
  Future<List<Booking>> build() async => _visible(await _repo.all());

  /// Create a booking and refresh the list. Returns the created booking.
  Future<Booking> createBooking(Booking booking) async {
    final created = await _repo.create(booking);
    state = AsyncData(_visible(await _repo.all()));
    return created;
  }

  /// Transition a booking's status (cancel / pay) and refresh.
  Future<Booking> setStatus(String id, BookingStatus status) async {
    final updated = await _repo.updateStatus(id, status);
    final current = state.valueOrNull ?? const <Booking>[];
    state = AsyncData([
      for (final booking in current)
        if (booking.id == id) updated else booking,
    ]);
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
    state = await AsyncValue.guard(() async => _visible(await _repo.all()));
  }
}
