import 'dart:math';

import 'city_coordinates.dart';

class CityRoutes {
  static final Map<String, List<LatLon>> _routes = _buildRoutes();

  static const Map<String, LatLon> _roadNodes = {
    'Bakı': LatLon(40.4093, 49.8671),
    'Sumqayıt': LatLon(40.5897, 49.6319),
    'Quba': LatLon(41.3614, 48.5131),
    'Şamaxı': LatLon(40.6314, 48.6414),
    'Göyçay': LatLon(40.6533, 47.7408),
    'Ucar': LatLon(40.5190, 47.6542),
    'Kürdəmir': LatLon(40.3426, 48.1565),
    'Yevlax': LatLon(40.6183, 47.1500),
    'Mingəçevir': LatLon(40.7703, 47.0597),
    'Şəki': LatLon(41.1975, 47.1708),
    'Naftalan': LatLon(40.5067, 46.8250),
    'Gəncə': LatLon(40.6828, 46.3606),
    'Şirvan': LatLon(39.9369, 48.9200),
    'Lənkəran': LatLon(38.7536, 48.8511),
    'Ağdam': LatLon(39.9919, 46.9281),
  };

  static const List<_RoadSegment> _roadSegments = [
    _RoadSegment('Bakı', 'Sumqayıt', [
      LatLon(40.4093, 49.8671),
      LatLon(40.4201, 49.8008),
      LatLon(40.4577, 49.7427),
      LatLon(40.5177, 49.6731),
      LatLon(40.5897, 49.6319),
    ]),
    _RoadSegment('Sumqayıt', 'Quba', [
      LatLon(40.5897, 49.6319),
      LatLon(40.7017, 49.4202),
      LatLon(40.8528, 49.2082),
      LatLon(41.0788, 48.9881),
      LatLon(41.2258, 48.7527),
      LatLon(41.3614, 48.5131),
    ]),
    _RoadSegment('Bakı', 'Şamaxı', [
      LatLon(40.4093, 49.8671),
      LatLon(40.4123, 49.7867),
      LatLon(40.4153, 49.6434),
      LatLon(40.4592, 49.4271),
      LatLon(40.5258, 49.1057),
      LatLon(40.5716, 48.8735),
      LatLon(40.6314, 48.6414),
    ]),
    _RoadSegment('Şamaxı', 'Göyçay', [
      LatLon(40.6314, 48.6414),
      LatLon(40.6354, 48.4549),
      LatLon(40.6150, 48.2458),
      LatLon(40.6257, 48.0443),
      LatLon(40.6533, 47.7408),
    ]),
    _RoadSegment('Göyçay', 'Ucar', [
      LatLon(40.6533, 47.7408),
      LatLon(40.6163, 47.6998),
      LatLon(40.5589, 47.6746),
      LatLon(40.5190, 47.6542),
    ]),
    _RoadSegment('Ucar', 'Yevlax', [
      LatLon(40.5190, 47.6542),
      LatLon(40.5484, 47.4892),
      LatLon(40.5854, 47.3007),
      LatLon(40.6183, 47.1500),
    ]),
    _RoadSegment('Yevlax', 'Mingəçevir', [
      LatLon(40.6183, 47.1500),
      LatLon(40.6837, 47.1484),
      LatLon(40.7333, 47.1073),
      LatLon(40.7703, 47.0597),
    ]),
    _RoadSegment('Mingəçevir', 'Şəki', [
      LatLon(40.7703, 47.0597),
      LatLon(40.8849, 47.1192),
      LatLon(41.0142, 47.1620),
      LatLon(41.1064, 47.1767),
      LatLon(41.1975, 47.1708),
    ]),
    _RoadSegment('Yevlax', 'Naftalan', [
      LatLon(40.6183, 47.1500),
      LatLon(40.5836, 47.0347),
      LatLon(40.5482, 46.9232),
      LatLon(40.5067, 46.8250),
    ]),
    _RoadSegment('Naftalan', 'Gəncə', [
      LatLon(40.5067, 46.8250),
      LatLon(40.5394, 46.6833),
      LatLon(40.5876, 46.5220),
      LatLon(40.6828, 46.3606),
    ]),
    _RoadSegment('Ucar', 'Kürdəmir', [
      LatLon(40.5190, 47.6542),
      LatLon(40.4488, 47.7928),
      LatLon(40.3861, 47.9655),
      LatLon(40.3426, 48.1565),
    ]),
    _RoadSegment('Kürdəmir', 'Şirvan', [
      LatLon(40.3426, 48.1565),
      LatLon(40.2483, 48.3734),
      LatLon(40.1436, 48.5969),
      LatLon(40.0349, 48.7852),
      LatLon(39.9369, 48.9200),
    ]),
    _RoadSegment('Bakı', 'Şirvan', [
      LatLon(40.4093, 49.8671),
      LatLon(40.3104, 49.7358),
      LatLon(40.1807, 49.5365),
      LatLon(40.0617, 49.2673),
      LatLon(39.9369, 48.9200),
    ]),
    _RoadSegment('Şirvan', 'Lənkəran', [
      LatLon(39.9369, 48.9200),
      LatLon(39.7355, 48.9337),
      LatLon(39.5146, 48.9194),
      LatLon(39.2097, 48.7918),
      LatLon(38.9747, 48.8313),
      LatLon(38.7536, 48.8511),
    ]),
    _RoadSegment('Yevlax', 'Ağdam', [
      LatLon(40.6183, 47.1500),
      LatLon(40.4243, 47.1455),
      LatLon(40.2153, 47.0746),
      LatLon(39.9919, 46.9281),
    ]),
  ];

  static List<LatLon> getRoute(String from, String to) {
    if (from == to) {
      final city = CityCoordinates.get(from) ?? _roadNodes[from];
      return city == null ? const [] : [city];
    }

    final direct = _routes[_key(from, to)];
    if (direct != null) return direct;

    final reverse = _routes[_key(to, from)];
    if (reverse != null) return reverse.reversed.toList();

    final graphRoute = _findRoadRoute(from, to);
    if (graphRoute.isNotEmpty) return graphRoute;

    final start = CityCoordinates.get(from) ?? _roadNodes[from];
    final end = CityCoordinates.get(to) ?? _roadNodes[to];
    if (start == null || end == null) return const [];

    return _densify([start, end]);
  }

  static Map<String, List<LatLon>> _buildRoutes() {
    final routes = <String, List<LatLon>>{};
    for (final segment in _roadSegments) {
      routes[_key(segment.from, segment.to)] = segment.points;
    }
    return routes;
  }

  static List<LatLon> _findRoadRoute(String from, String to) {
    if (!_roadNodes.containsKey(from) || !_roadNodes.containsKey(to)) {
      return const [];
    }

    final graph = <String, List<_RoadEdge>>{};
    for (final segment in _roadSegments) {
      graph.putIfAbsent(segment.from, () => []).add(
            _RoadEdge(segment.to, _polylineDistance(segment.points)),
          );
      graph.putIfAbsent(segment.to, () => []).add(
            _RoadEdge(segment.from, _polylineDistance(segment.points)),
          );
    }

    final distances = <String, double>{from: 0};
    final previous = <String, String>{};
    final unvisited = _roadNodes.keys.toSet();

    while (unvisited.isNotEmpty) {
      final current = unvisited.reduce((a, b) {
        return (distances[a] ?? double.infinity) <=
                (distances[b] ?? double.infinity)
            ? a
            : b;
      });

      if (current == to || distances[current] == null) break;
      unvisited.remove(current);

      for (final edge in graph[current] ?? const <_RoadEdge>[]) {
        if (!unvisited.contains(edge.to)) continue;
        final candidate = distances[current]! + edge.distance;
        if (candidate < (distances[edge.to] ?? double.infinity)) {
          distances[edge.to] = candidate;
          previous[edge.to] = current;
        }
      }
    }

    if (!previous.containsKey(to)) return const [];

    final nodePath = <String>[to];
    while (nodePath.last != from) {
      nodePath.add(previous[nodePath.last]!);
    }
    return _stitch(nodePath.reversed.toList());
  }

  static List<LatLon> _stitch(List<String> nodes) {
    final points = <LatLon>[];
    for (var i = 0; i < nodes.length - 1; i++) {
      final segment = _routes[_key(nodes[i], nodes[i + 1])];
      final segmentPoints =
          segment ?? _routes[_key(nodes[i + 1], nodes[i])]!.reversed.toList();
      if (points.isEmpty) {
        points.addAll(segmentPoints);
      } else {
        points.addAll(segmentPoints.skip(1));
      }
    }
    return points;
  }

  static List<LatLon> _densify(List<LatLon> points) {
    if (points.length < 2) return points;
    final output = <LatLon>[];
    for (var i = 0; i < points.length - 1; i++) {
      final start = points[i];
      final end = points[i + 1];
      output.add(start);
      for (var step = 1; step < 4; step++) {
        final t = step / 4;
        output.add(
          LatLon(
            start.lat + (end.lat - start.lat) * t,
            start.lon + (end.lon - start.lon) * t,
          ),
        );
      }
    }
    output.add(points.last);
    return output;
  }

  static double _polylineDistance(List<LatLon> points) {
    var total = 0.0;
    for (var i = 0; i < points.length - 1; i++) {
      total += _distance(points[i], points[i + 1]);
    }
    return total;
  }

  static double _distance(LatLon a, LatLon b) {
    const earthRadiusKm = 6371.0;
    final dLat = _radians(b.lat - a.lat);
    final dLon = _radians(b.lon - a.lon);
    final lat1 = _radians(a.lat);
    final lat2 = _radians(b.lat);
    final h = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
    return earthRadiusKm * 2 * atan2(sqrt(h), sqrt(1 - h));
  }

  static double _radians(double degrees) => degrees * pi / 180;

  static String _key(String from, String to) => '$from-$to';
}

class _RoadSegment {
  final String from;
  final String to;
  final List<LatLon> points;

  const _RoadSegment(this.from, this.to, this.points);
}

class _RoadEdge {
  final String to;
  final double distance;

  const _RoadEdge(this.to, this.distance);
}
