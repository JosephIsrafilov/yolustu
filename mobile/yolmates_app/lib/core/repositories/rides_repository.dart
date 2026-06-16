import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/providers.dart';
import '../../features/auth/data/auth_mode.dart';
import '../../shared/data/mock_data.dart';
import '../../shared/models/trip.dart';
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
  static const Duration _latency = Duration(milliseconds: 120);

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

final ridesRepositoryProvider = Provider<RidesRepository>(
  (ref) {
    if (AuthMode.isApi) {
      return ApiRidesRepository(ref.read(apiClientProvider));
    }
    return MockRidesRepository();
  },
);

/// Search parameters used as the [rideSearchProvider] family key.
///
/// Keep the date normalized to day precision so rebuilds do not churn provider
/// instances for the same search.
class RideSearchParams {
  final String fromCity;
  final String toCity;
  final int passengers;
  final DateTime date;

  const RideSearchParams({
    required this.fromCity,
    required this.toCity,
    required this.date,
    this.passengers = 1,
  });

  @override
  bool operator ==(Object other) =>
      other is RideSearchParams &&
      other.fromCity == fromCity &&
      other.toCity == toCity &&
      other.passengers == passengers &&
      other.date.year == date.year &&
      other.date.month == date.month &&
      other.date.day == date.day;

  @override
  int get hashCode =>
      Object.hash(fromCity, toCity, passengers, date.year, date.month, date.day);
}

final rideSearchProvider =
    FutureProvider.family<List<Trip>, RideSearchParams>((ref, params) {
  return ref.read(ridesRepositoryProvider).search(
        fromCity: params.fromCity,
        toCity: params.toCity,
        date: DateTime(params.date.year, params.date.month, params.date.day),
        passengers: params.passengers,
      );
});
