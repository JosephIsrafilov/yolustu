import 'dart:async';
import '../../../shared/data/city_routes.dart';

class TrackingLocation {
  final double latitude;
  final double longitude;
  final double progress; // 0.0 to 1.0
  final double etaMinutes;

  const TrackingLocation({
    required this.latitude,
    required this.longitude,
    required this.progress,
    required this.etaMinutes,
  });
}

/// Abstract contract for real-time ride tracking.
///
/// Later, this can be implemented by a WebSocket/GPS-based tracking repository.
abstract class RideTrackingRepository {
  Stream<TrackingLocation> trackRide(String rideId, String fromCity, String toCity);
}

class MockRideTrackingRepository implements RideTrackingRepository {
  @override
  Stream<TrackingLocation> trackRide(String rideId, String fromCity, String toCity) {
    final route = CityRoutes.getRoute(fromCity, toCity);
    if (route.isEmpty) {
      return Stream.value(const TrackingLocation(
        latitude: 40.4093,
        longitude: 49.8671,
        progress: 0.0,
        etaMinutes: 240.0,
      ));
    }

    // Emit tracking updates every second, moving along the route coordinates.
    return Stream.periodic(const Duration(seconds: 1), (tick) {
      final totalTicks = 30; // 30 seconds to complete the simulation
      final progress = (tick / totalTicks).clamp(0.0, 1.0);
      final segmentIndex = (progress * (route.length - 1)).floor().clamp(0, route.length - 2);
      final segmentProgress = (progress * (route.length - 1)) - segmentIndex;

      final p1 = route[segmentIndex];
      final p2 = route[segmentIndex + 1];

      final lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
      final lon = p1.lon + (p2.lon - p1.lon) * segmentProgress;
      final eta = (1.0 - progress) * 240.0; // Starts at 240 mins (4 hours)

      return TrackingLocation(
        latitude: lat,
        longitude: lon,
        progress: progress,
        etaMinutes: eta,
      );
    }).take(31); // stop after 100%
  }
}
