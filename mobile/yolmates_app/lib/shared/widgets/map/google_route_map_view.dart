import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme.dart';
import '../../data/city_coordinates.dart';
import '../../data/city_routes.dart';

/// Real Google Maps integration for Yolüstü routes.
class GoogleRouteMapView extends StatefulWidget {
  final String origin;
  final String destination;
  final double progress; // 0.0 to 1.0 to animate the car along the route.
  final bool showCar;

  const GoogleRouteMapView({
    required this.origin,
    required this.destination,
    this.progress = 0.0,
    this.showCar = false,
    super.key,
  });

  @override
  State<GoogleRouteMapView> createState() => _GoogleRouteMapViewState();
}

class _GoogleRouteMapViewState extends State<GoogleRouteMapView> {
  GoogleMapController? _mapController;
  late List<LatLon> _routePoints;

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  @override
  void didUpdateWidget(GoogleRouteMapView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.origin != widget.origin || oldWidget.destination != widget.destination) {
      _loadRoute();
      _fitBounds();
    }
  }

  void _loadRoute() {
    _routePoints = CityRoutes.getRoute(widget.origin, widget.destination);
  }

  void _fitBounds() {
    if (_mapController == null || _routePoints.isEmpty) return;
    double minLat = 90.0, maxLat = -90.0;
    double minLon = 180.0, maxLon = -180.0;
    for (var pt in _routePoints) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    }
    
    try {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat, minLon),
            northeast: LatLng(maxLat, maxLon),
          ),
          40.0, // padding
        ),
      );
    } catch (_) {
      // Bounds might be zero size or map not layout yet
    }
  }

  Set<Polyline> _buildPolylines() {
    if (_routePoints.isEmpty) return {};
    return {
      Polyline(
        polylineId: const PolylineId('route'),
        points: _routePoints.map((p) => LatLng(p.lat, p.lon)).toList(),
        color: AppTheme.teal,
        width: 5,
        geodesic: true,
      )
    };
  }

  Set<Marker> _buildMarkers() {
    if (_routePoints.isEmpty) return {};
    final markers = <Marker>{};

    final start = _routePoints.first;
    final end = _routePoints.last;

    markers.add(
      Marker(
        markerId: const MarkerId('start'),
        position: LatLng(start.lat, start.lon),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      ),
    );

    markers.add(
      Marker(
        markerId: const MarkerId('end'),
        position: LatLng(end.lat, end.lon),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      ),
    );

    if (widget.showCar && _routePoints.length > 1) {
      final totalSegments = _routePoints.length - 1;
      final currentSegmentVal = widget.progress * totalSegments;
      final segmentIndex = currentSegmentVal.floor().clamp(0, totalSegments - 1);
      final segmentProgress = currentSegmentVal - segmentIndex;

      final p1 = _routePoints[segmentIndex];
      final p2 = _routePoints[segmentIndex + 1];

      final lat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
      final lon = p1.lon + (p2.lon - p1.lon) * segmentProgress;

      // Calculate bearing/heading
      final dx = p2.lon - p1.lon;
      final dy = p2.lat - p1.lat;
      final heading = (atan2(dx, dy * cos(pi * p1.lat / 180)) * 180 / pi); // simplified bearing

      markers.add(
        Marker(
          markerId: const MarkerId('car'),
          position: LatLng(lat, lon),
          rotation: heading,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          anchor: const Offset(0.5, 0.5),
        ),
      );
    }

    return markers;
  }

  @override
  Widget build(BuildContext context) {
    final initialPos = _routePoints.isNotEmpty 
        ? LatLng(_routePoints.first.lat, _routePoints.first.lon)
        : const LatLng(40.4093, 49.8671); // Baku fallback

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: initialPos,
              zoom: 10,
            ),
            polylines: _buildPolylines(),
            markers: _buildMarkers(),
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            mapToolbarEnabled: false,
            zoomControlsEnabled: false,
            onMapCreated: (controller) {
              _mapController = controller;
              Future.delayed(const Duration(milliseconds: 300), _fitBounds);
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
  }
}
