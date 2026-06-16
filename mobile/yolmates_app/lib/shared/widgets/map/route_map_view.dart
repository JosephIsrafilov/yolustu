import 'package:flutter/foundation.dart';
import 'dart:math';
import 'package:flutter/material.dart';

import '../../../core/theme.dart';
import '../../data/city_coordinates.dart';
import '../../data/city_routes.dart';
import 'google_route_map_view.dart';

/// Interactive Map wrapper choosing between Google Maps and Canvas Map fallback.
class RouteMapView extends StatelessWidget {
  final String origin;
  final String destination;
  final double progress; // 0.0 to 1.0 to animate the car along the route.
  final bool showCar;
  final bool forceCanvas;
  final bool preferGoogleMap;

  const RouteMapView({
    required this.origin,
    required this.destination,
    this.progress = 0.0,
    this.showCar = false,
    this.forceCanvas = false,
    this.preferGoogleMap = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    if (forceCanvas || kIsWeb || !preferGoogleMap) {
      return CanvasRouteMapView(
        origin: origin,
        destination: destination,
        progress: progress,
        showCar: showCar,
      );
    }
    return GoogleRouteMapView(
      origin: origin,
      destination: destination,
      progress: progress,
      showCar: showCar,
    );
  }
}

/// Interactive Canvas Map view for Yolüstü routes (Fallback).
///
/// Draws Azerbaijani geographic bounds, Caspean sea, routes, markers, and an animated car.
class CanvasRouteMapView extends StatefulWidget {
  final String origin;
  final String destination;
  final double progress; // 0.0 to 1.0 to animate the car along the route.
  final bool showCar;

  const CanvasRouteMapView({
    required this.origin,
    required this.destination,
    this.progress = 0.0,
    this.showCar = false,
    super.key,
  });

  @override
  State<CanvasRouteMapView> createState() => _CanvasRouteMapViewState();
}

class _CanvasRouteMapViewState extends State<CanvasRouteMapView> with SingleTickerProviderStateMixin {
  late List<LatLon> _routePoints;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  @override
  void didUpdateWidget(CanvasRouteMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.origin != widget.origin || oldWidget.destination != widget.destination) {
      _loadRoute();
    }
  }

  void _loadRoute() {
    _routePoints = CityRoutes.getRoute(widget.origin, widget.destination);
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return Container(
            color: const Color(0xFFF1F5F9), // Slate 100 bg
            child: Stack(
              children: [
                // Custom Map Canvas
                CustomPaint(
                  size: Size(constraints.maxWidth, constraints.maxHeight),
                  painter: _MapPainter(
                    routePoints: _routePoints,
                    progress: widget.progress,
                    showCar: widget.showCar,
                  ),
                ),
                // Overlay HUD
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Text(
                      '${widget.origin} → ${widget.destination}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.navy,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  final List<LatLon> routePoints;
  final double progress;
  final bool showCar;

  _MapPainter({
    required this.routePoints,
    required this.progress,
    required this.showCar,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (routePoints.isEmpty) return;

    // Bounding Box of Azerbaijan Map (fit the points to this box with some margins)
    double minLat = 38.3;
    double maxLat = 41.9;
    double minLon = 44.5;
    double maxLon = 50.8;

    // Find bounding box of only our route points to focus on it
    double routeMinLat = 90.0;
    double routeMaxLat = -90.0;
    double routeMinLon = 180.0;
    double routeMaxLon = -180.0;

    for (final pt in routePoints) {
      if (pt.lat < routeMinLat) routeMinLat = pt.lat;
      if (pt.lat > routeMaxLat) routeMaxLat = pt.lat;
      if (pt.lon < routeMinLon) routeMinLon = pt.lon;
      if (pt.lon > routeMaxLon) routeMaxLon = pt.lon;
    }

    // Add some padding to route bounding box
    final latPadding = max((routeMaxLat - routeMinLat) * 0.35, 0.4);
    final lonPadding = max((routeMaxLon - routeMinLon) * 0.35, 0.4);

    minLat = max(routeMinLat - latPadding, 38.0);
    maxLat = min(routeMaxLat + latPadding, 42.2);
    minLon = max(routeMinLon - lonPadding, 44.0);
    maxLon = min(routeMaxLon + lonPadding, 51.0);

    // Map function
    Offset toOffset(LatLon pt) {
      final x = ((pt.lon - minLon) / (maxLon - minLon)) * size.width;
      // Invert Y because canvas Y starts from top
      final y = size.height - (((pt.lat - minLat) / (maxLat - minLat)) * size.height);
      return Offset(x, y);
    }

    // 1. Draw Caspean Sea (on the right if lon reaches near 49.5+)
    if (maxLon > 49.0) {
      final seaPaint = Paint()..color = const Color(0xFFE0F2FE); // Light blue
      final seaOffset = ((49.5 - minLon) / (maxLon - minLon)) * size.width;
      if (seaOffset < size.width) {
        canvas.drawRect(
          Rect.fromLTRB(max(0.0, seaOffset), 0.0, size.width, size.height),
          seaPaint,
        );
      }
    }

    // 2. Draw Gridlines/Decoration
    final gridPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 1.0;
    for (var i = 1; i < 6; i++) {
      final x = size.width * i / 6;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
      final y = size.height * i / 6;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // 3. Draw Route Polyline
    final routeOffsets = routePoints.map(toOffset).toList();
    final path = Path()..moveTo(routeOffsets.first.dx, routeOffsets.first.dy);
    for (var i = 1; i < routeOffsets.length; i++) {
      path.lineTo(routeOffsets[i].dx, routeOffsets[i].dy);
    }

    final routePaint = Paint()
      ..shader = const LinearGradient(
        colors: [AppTheme.teal, AppTheme.tealDark],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, routePaint);

    // 4. Draw Start/End Markers
    final startOffset = routeOffsets.first;
    final endOffset = routeOffsets.last;

    // Start Marker (Green Pin)
    final pinPaint = Paint()..style = PaintingStyle.fill;
    pinPaint.color = Colors.green.shade600;
    canvas.drawCircle(startOffset, 8.0, pinPaint);
    pinPaint.color = Colors.white;
    canvas.drawCircle(startOffset, 3.0, pinPaint);

    // End Marker (Red Pin)
    pinPaint.color = Colors.red.shade600;
    canvas.drawCircle(endOffset, 8.0, pinPaint);
    pinPaint.color = Colors.white;
    canvas.drawCircle(endOffset, 3.0, pinPaint);

    // 5. Draw Animated Car (if showCar is true)
    if (showCar && routeOffsets.length > 1) {
      // Find position of the car on the path based on progress
      final totalSegments = routeOffsets.length - 1;
      final currentSegmentVal = progress * totalSegments;
      final segmentIndex = currentSegmentVal.floor().clamp(0, totalSegments - 1);
      final segmentProgress = currentSegmentVal - segmentIndex;

      final p1 = routeOffsets[segmentIndex];
      final p2 = routeOffsets[segmentIndex + 1];

      // Interpolated position
      final carOffset = Offset(
        p1.dx + (p2.dx - p1.dx) * segmentProgress,
        p1.dy + (p2.dy - p1.dy) * segmentProgress,
      );

      // Angle of direction
      final angle = atan2(p2.dy - p1.dy, p2.dx - p1.dx);

      canvas.save();
      canvas.translate(carOffset.dx, carOffset.dy);
      canvas.rotate(angle);

      // Draw simple triangle representing car heading
      final carPaint = Paint()
        ..color = AppTheme.navy
        ..style = PaintingStyle.fill;
      final carPath = Path()
        ..moveTo(10, 0)
        ..lineTo(-8, -6)
        ..lineTo(-8, 6)
        ..close();
      canvas.drawPath(carPath, carPaint);

      // Outer glow/dot
      final carGlow = Paint()
        ..color = AppTheme.teal
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0;
      canvas.drawCircle(Offset.zero, 12, carGlow);

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _MapPainter oldDelegate) {
    return oldDelegate.routePoints != routePoints ||
        oldDelegate.progress != progress ||
        oldDelegate.showCar != showCar;
  }
}

/// A non-interactive preview map card.
class RideMapPreview extends StatelessWidget {
  final String origin;
  final String destination;
  final double height;

  const RideMapPreview({
    required this.origin,
    required this.destination,
    this.height = 140,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: RouteMapView(
        origin: origin,
        destination: destination,
        showCar: false,
      ),
    );
  }
}
