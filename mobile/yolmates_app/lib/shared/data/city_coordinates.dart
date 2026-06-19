/// Temporary city coordinate mapping for API search.
///
/// Backend search can accept city-only but works better with lat/lon.
/// This provides basic coordinates for common Azerbaijani cities used in the app.
///
/// Future: Replace with proper geocoding or map-based selection.
class CityCoordinates {
  static const Map<String, LatLon> _coords = {
    'Bakı': LatLon(40.4093, 49.8671),
    'Gəncə': LatLon(40.6828, 46.3606),
    'Sumqayıt': LatLon(40.5897, 49.6319),
    'Mingəçevir': LatLon(40.7703, 47.0597),
    'Şəki': LatLon(41.1975, 47.1708),
    'Quba': LatLon(41.3614, 48.5131),
    'Şamaxı': LatLon(40.6314, 48.6414),
    'Göyçay': LatLon(40.6533, 47.7408),
    'Ucar': LatLon(40.5190, 47.6542),
    'Kürdəmir': LatLon(40.3426, 48.1565),
    'Yevlax': LatLon(40.6183, 47.1500),
    'Naftalan': LatLon(40.5067, 46.8250),
    'Lənkəran': LatLon(38.7536, 48.8511),
    'Şirvan': LatLon(39.9369, 48.9200),
    'Naxçıvan': LatLon(39.2092, 45.4122),
    'Ağdam': LatLon(39.9919, 46.9281),
  };

  static LatLon? get(String city) => _coords[city];
}

class LatLon {
  final double lat;
  final double lon;

  const LatLon(this.lat, this.lon);
}
