import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme.dart';
import '../../data/city_coordinates.dart';
import '../../data/city_routes.dart';

class LeafletRouteMapView extends StatefulWidget {
  final String origin;
  final String destination;
  final double progress; // 0.0 to 1.0
  final bool showCar;

  const LeafletRouteMapView({
    required this.origin,
    required this.destination,
    this.progress = 0.0,
    this.showCar = false,
    super.key,
  });

  @override
  State<LeafletRouteMapView> createState() => _LeafletRouteMapViewState();
}

class _LeafletRouteMapViewState extends State<LeafletRouteMapView>
    with SingleTickerProviderStateMixin {
  final MapController _mapController = MapController();
  late List<LatLon> _routePoints;

  // Smooth animation between progress ticks
  late AnimationController _animController;
  late Animation<double> _smoothProgress;
  double _prevProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _loadRoute();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _smoothProgress = Tween<double>(begin: 0.0, end: 0.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    _mapController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(LeafletRouteMapView old) {
    super.didUpdateWidget(old);
    if (old.origin != widget.origin || old.destination != widget.destination) {
      _loadRoute();
      _fitBounds();
    }
    if (old.progress != widget.progress) {
      _smoothProgress = Tween<double>(
        begin: _prevProgress,
        end: widget.progress,
      ).animate(
          CurvedAnimation(parent: _animController, curve: Curves.easeInOut));
      _prevProgress = widget.progress;
      _animController
        ..reset()
        ..forward();
    }
  }

  void _loadRoute() {
    _routePoints = CityRoutes.getRoute(widget.origin, widget.destination);
  }

  void _fitBounds() {
    if (_routePoints.isEmpty) return;
    var minLat = 90.0, maxLat = -90.0, minLon = 180.0, maxLon = -180.0;
    for (final pt in _routePoints) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    }
    if (maxLat - minLat < 0.01) {
      minLat -= 0.05;
      maxLat += 0.05;
    }
    if (maxLon - minLon < 0.01) {
      minLon -= 0.05;
      maxLon += 0.05;
    }
    
    try {
      final bounds = LatLngBounds(LatLng(minLat, minLon), LatLng(maxLat, maxLon));
      _mapController.fitCamera(
        CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.all(48.0),
        ),
      );
    } catch (_) {}
  }

  List<Marker> _buildMarkers(double progress) {
    if (_routePoints.isEmpty) return [];
    final markers = <Marker>[];

    markers.add(Marker(
      width: 40.0,
      height: 40.0,
      point: LatLng(_routePoints.first.lat, _routePoints.first.lon),
      child: const Icon(Icons.location_on, color: Colors.green, size: 40),
    ));
    markers.add(Marker(
      width: 40.0,
      height: 40.0,
      point: LatLng(_routePoints.last.lat, _routePoints.last.lon),
      child: const Icon(Icons.location_on, color: Colors.red, size: 40),
    ));

    if (widget.showCar && _routePoints.length > 1) {
      final totalSegments = _routePoints.length - 1;
      final segVal = progress * totalSegments;
      final segIdx = segVal.floor().clamp(0, totalSegments - 1);
      final segProg = segVal - segIdx;

      final p1 = _routePoints[segIdx];
      final p2 = _routePoints[segIdx + 1];
      final lat = p1.lat + (p2.lat - p1.lat) * segProg;
      final lon = p1.lon + (p2.lon - p1.lon) * segProg;
      final heading =
          atan2(p2.lon - p1.lon, (p2.lat - p1.lat) * cos(pi * p1.lat / 180)) *
              180 /
              pi;

      markers.add(Marker(
        width: 40.0,
        height: 40.0,
        point: LatLng(lat, lon),
        child: Transform.rotate(
          angle: heading * pi / 180,
          child: const Icon(Icons.directions_car, color: AppTheme.tealDark, size: 30),
        ),
      ));
    }

    return markers;
  }

  @override
  Widget build(BuildContext context) {
    final initialPos = _routePoints.isNotEmpty
        ? LatLng(_routePoints.first.lat, _routePoints.first.lon)
        : const LatLng(40.4093, 49.8671);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          AnimatedBuilder(
            animation: _smoothProgress,
            builder: (context, _) {
              return FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: initialPos,
                  initialZoom: 8,
                  onMapReady: () {
                    Future.delayed(const Duration(milliseconds: 400), _fitBounds);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.yolmates.app',
                  ),
                  PolylineLayer(
                    polylines: [
                      Polyline(
                        points: _routePoints.map((p) => LatLng(p.lat, p.lon)).toList(),
                        strokeWidth: 5.0,
                        color: AppTheme.teal,
                      ),
                    ],
                  ),
                  MarkerLayer(markers: _buildMarkers(_smoothProgress.value)),
                ],
              );
            },
          ),
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
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Text(
                '${widget.origin} → ${widget.destination}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.navy,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
