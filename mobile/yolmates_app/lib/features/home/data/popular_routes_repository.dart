import 'popular_route.dart';

/// Repository interface for popular routes.
abstract class PopularRoutesRepository {
  Future<List<PopularRoute>> getPopularRoutes();
}

/// Mock implementation with realistic Azerbaijan routes.
class MockPopularRoutesRepository implements PopularRoutesRepository {
  @override
  Future<List<PopularRoute>> getPopularRoutes() async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 300));

    return const [
      PopularRoute(
        fromCity: 'Bakı',
        toCity: 'Gəncə',
        averagePrice: 15.0,
        dailyTrips: 25,
      ),
      PopularRoute(
        fromCity: 'Bakı',
        toCity: 'Sumqayıt',
        averagePrice: 3.0,
        dailyTrips: 40,
      ),
      PopularRoute(
        fromCity: 'Bakı',
        toCity: 'Quba',
        averagePrice: 10.0,
        dailyTrips: 18,
      ),
      PopularRoute(
        fromCity: 'Bakı',
        toCity: 'Lənkəran',
        averagePrice: 12.0,
        dailyTrips: 15,
      ),
      PopularRoute(
        fromCity: 'Bakı',
        toCity: 'Şamaxı',
        averagePrice: 8.0,
        dailyTrips: 12,
      ),
      PopularRoute(
        fromCity: 'Gəncə',
        toCity: 'Bakı',
        averagePrice: 15.0,
        dailyTrips: 22,
      ),
    ];
  }
}
