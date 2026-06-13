import 'city_coordinates.dart';

class CityRoutes {
  /// Local fallback polyline coordinates between popular cities.
  static const Map<String, List<LatLon>> _fallbackRoutes = {
    'Bakı-Gəncə': [
      LatLon(40.4093, 49.8671), // Baku
      LatLon(40.5897, 49.6319), // Sumqayıt
      LatLon(40.7703, 47.0597), // Mingəçevir
      LatLon(40.6828, 46.3606), // Gəncə
    ],
    'Bakı-Quba': [
      LatLon(40.4093, 49.8671), // Baku
      LatLon(40.5897, 49.6319), // Sumqayıt
      LatLon(41.3614, 48.5131), // Quba
    ],
    'Bakı-Lənkəran': [
      LatLon(40.4093, 49.8671), // Baku
      LatLon(39.9369, 48.9200), // Şirvan
      LatLon(38.7536, 48.8511), // Lənkəran
    ],
  };

  /// Returns route coordinates between two cities.
  static List<LatLon> getRoute(String from, String to) {
    final key1 = '$from-$to';
    if (_fallbackRoutes.containsKey(key1)) {
      return _fallbackRoutes[key1]!;
    }

    final key2 = '$to-$from';
    if (_fallbackRoutes.containsKey(key2)) {
      return _fallbackRoutes[key2]!.reversed.toList();
    }

    // Generate a smooth bezier curved polyline if not predefined
    final start = CityCoordinates.get(from) ?? const LatLon(40.4093, 49.8671);
    final end = CityCoordinates.get(to) ?? const LatLon(40.6828, 46.3606);

    return _generateBezierCurve(start, end);
  }

  static List<LatLon> _generateBezierCurve(LatLon start, LatLon end) {
    final points = <LatLon>[];
    const steps = 15;

    // Control point for a slight curve
    final midLat = (start.lat + end.lat) / 2;
    final midLon = (start.lon + end.lon) / 2;
    final ctrlLat = midLat + (end.lon - start.lon) * 0.15;
    final ctrlLon = midLon - (end.lat - start.lat) * 0.15;

    for (var i = 0; i <= steps; i++) {
      final t = i / steps;
      final lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * ctrlLat + t * t * end.lat;
      final lon = (1 - t) * (1 - t) * start.lon + 2 * (1 - t) * t * ctrlLon + t * t * end.lon;
      points.add(LatLon(lat, lon));
    }
    return points;
  }
}
