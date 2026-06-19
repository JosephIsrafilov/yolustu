import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/shared/data/city_routes.dart';

void main() {
  const knownCities = [
    'Bakı',
    'Gəncə',
    'Sumqayıt',
    'Mingəçevir',
    'Şəki',
    'Quba',
    'Lənkəran',
    'Şirvan',
    'Ağdam',
    'Şamaxı',
  ];

  test('Bakı to Şamaxı uses a road polyline instead of generated curve', () {
    final route = CityRoutes.getRoute('Bakı', 'Şamaxı');

    expect(route.length, greaterThan(2));
    expect(route.first.lat, closeTo(40.4093, 0.0001));
    expect(route.first.lon, closeTo(49.8671, 0.0001));
    expect(route.last.lat, closeTo(40.6314, 0.0001));
    expect(route.last.lon, closeTo(48.6414, 0.0001));
  });

  test('known city pairs use stitched road polylines', () {
    for (final from in knownCities) {
      for (final to in knownCities) {
        if (from == to) continue;

        final route = CityRoutes.getRoute(from, to);

        expect(
          route.length,
          greaterThan(2),
          reason: '$from -> $to should use road waypoints',
        );
      }
    }
  });
}
