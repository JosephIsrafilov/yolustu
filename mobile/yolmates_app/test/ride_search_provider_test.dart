import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/repositories/rides_repository.dart';
import 'package:yolmates_app/shared/models/trip.dart';
import 'package:yolmates_app/shared/models/user.dart';

class _FakeRidesRepository implements RidesRepository {
  String? fromCity;
  String? toCity;
  int? passengers;
  DateTime? date;

  @override
  Future<Trip?> rideById(String id) async => null;

  @override
  Future<List<Trip>> search({
    required String fromCity,
    required String toCity,
    required DateTime date,
    int passengers = 1,
  }) async {
    this.fromCity = fromCity;
    this.toCity = toCity;
    this.passengers = passengers;
    this.date = date;
    return [
      Trip(
        id: 'ride-1',
        driver: const User(
          id: 'user-1',
          name: 'Driver',
          phone: '+994500000000',
          rating: 4.9,
          tripCount: 10,
        ),
        fromCity: fromCity,
        toCity: toCity,
        departureTime: DateTime(2024, 1, 1, 10),
        price: 15,
        availableSeats: 3,
        totalSeats: 4,
        status: 'active',
      ),
    ];
  }
}

void main() {
  group('rideSearchProvider', () {
    test('passes route params to repository and returns rides', () async {
      final repo = _FakeRidesRepository();
      final container = ProviderContainer(
        overrides: [ridesRepositoryProvider.overrideWithValue(repo)],
      );
      addTearDown(container.dispose);

      final before = DateTime.now();
      final rides = await container.read(
        rideSearchProvider(
          const RideSearchParams(fromCity: 'Baku', toCity: 'Ganja', passengers: 2),
        ).future,
      );
      final after = DateTime.now();

      expect(rides, hasLength(1));
      expect(repo.fromCity, 'Baku');
      expect(repo.toCity, 'Ganja');
      expect(repo.passengers, 2);
      expect(repo.date!.isAfter(before.subtract(const Duration(seconds: 1))), isTrue);
      expect(repo.date!.isBefore(after.add(const Duration(seconds: 1))), isTrue);
    });

    test('RideSearchParams equality is stable for provider keys', () {
      const a = RideSearchParams(fromCity: 'Baku', toCity: 'Ganja', passengers: 2);
      const b = RideSearchParams(fromCity: 'Baku', toCity: 'Ganja', passengers: 2);
      const c = RideSearchParams(fromCity: 'Baku', toCity: 'Quba', passengers: 2);

      expect(a, b);
      expect(a.hashCode, b.hashCode);
      expect(a == c, isFalse);
    });
  });
}
