import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/providers.dart';
import '../../features/auth/data/auth_mode.dart';
import '../../shared/models/trip.dart';
import '../../shared/data/mock_data.dart';
import 'api_rides_repository.dart';

/// Search/detail contract for rides. Backend swap point.
abstract class RidesRepository {
  Future<List<Trip>> search({
    required String fromCity,
    required String toCity,
    required DateTime date,
    int passengers = 1,
  });

  Future<Trip?> rideById(String id);
}

class MockRidesRepository implements RidesRepository {
  static const Duration _latency = Duration(milliseconds: 600);

  @override
  Future<List<Trip>> search({
    required String fromCity,
    required String toCity,
    required DateTime date,
    int passengers = 1,
  }) async {
    await Future.delayed(_latency);
    return MockData.ridesFor(
      fromCity: fromCity,
      toCity: toCity,
      date: date,
      minSeats: passengers,
    );
  }

  @override
  Future<Trip?> rideById(String id) async {
    await Future.delayed(_latency);
    return MockData.rideById(id);
  }
}

// --- Providers ---------------------------------------------------------------

/// Binds to real API or mock based on --dart-define=API_MODE.
final ridesRepositoryProvider = Provider<RidesRepository>(
  (ref) {
    if (AuthMode.isApi) {
      return ApiRidesRepository(ref.read(apiClientProvider));
    } else {
      return MockRidesRepository();
    }
  },
);

/// Search parameters used as the [rideSearchProvider] family key.
///
/// A plain class (not a record carrying a [DateTime]) so the key is stable
/// across rebuilds — a fresh `DateTime.now()` in the key would mint a new
/// provider every build and re-trigger the search forever.
class RideSearchParams {
  final String fromCity;
  final String toCity;
  final int passengers;

  const RideSearchParams({
    required this.fromCity,
    required this.toCity,
    this.passengers = 1,
  });

  @override
  bool operator ==(Object other) =>
      other is RideSearchParams &&
      other.fromCity == fromCity &&
      other.toCity == toCity &&
      other.passengers == passengers;

  @override
  int get hashCode => Object.hash(fromCity, toCity, passengers);
}

/// Async search results for a route. The UI watches this and renders the
/// shared loading/error/empty states off its [AsyncValue].
final rideSearchProvider =
    FutureProvider.family<List<Trip>, RideSearchParams>((ref, params) {
  return ref.read(ridesRepositoryProvider).search(
        fromCity: params.fromCity,
        toCity: params.toCity,
        date: DateTime.now(),
        passengers: params.passengers,
      );
});
