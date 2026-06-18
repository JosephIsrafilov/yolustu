import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import 'popular_route.dart';

abstract class PopularRoutesRepository {
  Future<List<PopularRoute>> getPopularRoutes();
}

/// Derives popular routes from live ride search data.
///
/// Queries each known route pair and uses the live count + avg price.
/// Falls back to mock data if the backend returns nothing.
class ApiPopularRoutesRepository implements PopularRoutesRepository {
  final ApiClient _client;

  static const _routes = [
    ('Bakı', 'Gəncə'),
    ('Bakı', 'Sumqayıt'),
    ('Bakı', 'Quba'),
    ('Bakı', 'Lənkəran'),
    ('Bakı', 'Şamaxı'),
    ('Gəncə', 'Bakı'),
  ];

  ApiPopularRoutesRepository(this._client);

  @override
  Future<List<PopularRoute>> getPopularRoutes() async {
    final results = <PopularRoute>[];
    for (final (from, to) in _routes) {
      try {
        final response = await _client.get('/rides/search', queryParameters: {
          'origin_city': from,
          'dest_city': to,
          'min_seats': 1,
          'limit': 50,
        });
        final data = response.data;
        final List<dynamic> items = data is List
            ? data
            : (data is Map ? (data['items'] ?? data['data'] ?? []) : []);

        if (items.isEmpty) {
          results.add(_fallback(from, to));
          continue;
        }

        double totalPrice = 0;
        for (final ride in items) {
          totalPrice += _parseDecimal(ride['price_per_seat']);
        }
        results.add(PopularRoute(
          fromCity: from,
          toCity: to,
          averagePrice: totalPrice / items.length,
          dailyTrips: items.length,
        ));
      } on DioException catch (e) {
        final err = e.error;
        if (err is ApiException && err.statusCode == 404) {
          results.add(_fallback(from, to));
        }
        // skip silently on network errors — fallback keeps the card alive
        results.add(_fallback(from, to));
      }
    }
    return results;
  }

  static double _parseDecimal(dynamic v) {
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v) ?? 0.0;
    return 0.0;
  }
}

/// Static fallback so the home screen never shows empty popular routes.
class MockPopularRoutesRepository implements PopularRoutesRepository {
  @override
  Future<List<PopularRoute>> getPopularRoutes() async {
    return const [
      PopularRoute(
          fromCity: 'Bakı',
          toCity: 'Gəncə',
          averagePrice: 15.0,
          dailyTrips: 25),
      PopularRoute(
          fromCity: 'Bakı',
          toCity: 'Sumqayıt',
          averagePrice: 3.0,
          dailyTrips: 40),
      PopularRoute(
          fromCity: 'Bakı', toCity: 'Quba', averagePrice: 10.0, dailyTrips: 18),
      PopularRoute(
          fromCity: 'Bakı',
          toCity: 'Lənkəran',
          averagePrice: 12.0,
          dailyTrips: 15),
      PopularRoute(
          fromCity: 'Bakı',
          toCity: 'Şamaxı',
          averagePrice: 8.0,
          dailyTrips: 12),
      PopularRoute(
          fromCity: 'Gəncə',
          toCity: 'Bakı',
          averagePrice: 15.0,
          dailyTrips: 22),
    ];
  }
}

PopularRoute _fallback(String from, String to) => PopularRoute(
      fromCity: from,
      toCity: to,
      averagePrice: 0,
      dailyTrips: 0,
    );
