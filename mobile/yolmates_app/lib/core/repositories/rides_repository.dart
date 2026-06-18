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
    DateTime? date,
    DateTime? dateTo,
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
    DateTime? date,
    DateTime? dateTo,
    int passengers = 1,
  }) async {
    await Future.delayed(_latency);
    return MockData.ridesFor(
      fromCity: fromCity,
      toCity: toCity,
      date: date ?? DateTime.now(),
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
/// Keep dates normalized to day precision so rebuilds do not churn provider
/// instances for the same search.
class RideSearchParams {
  final String fromCity;
  final String toCity;
  final int passengers;
  final DateTime? date;
  final DateTime? dateTo;

  const RideSearchParams({
    required this.fromCity,
    required this.toCity,
    this.date,
    this.dateTo,
    this.passengers = 1,
  });

  DateTime? get normalizedDate =>
      date == null ? null : DateTime(date!.year, date!.month, date!.day);

  DateTime? get normalizedDateTo =>
      dateTo == null ? null : DateTime(dateTo!.year, dateTo!.month, dateTo!.day);

  @override
  bool operator ==(Object other) =>
      other is RideSearchParams &&
      other.fromCity == fromCity &&
      other.toCity == toCity &&
      other.passengers == passengers &&
      other.normalizedDate == normalizedDate &&
      other.normalizedDateTo == normalizedDateTo;

  @override
  int get hashCode =>
      Object.hash(fromCity, toCity, passengers, normalizedDate, normalizedDateTo);
}

final rideSearchProvider =
    FutureProvider.family<List<Trip>, RideSearchParams>((ref, params) {
  return ref.read(ridesRepositoryProvider).search(
        fromCity: params.fromCity,
        toCity: params.toCity,
        date: params.normalizedDate,
        dateTo: params.normalizedDateTo,
        passengers: params.passengers,
      );
});

final rideByIdProvider = FutureProvider.family<Trip?, String>((ref, rideId) {
  return ref.read(ridesRepositoryProvider).rideById(rideId);
});
