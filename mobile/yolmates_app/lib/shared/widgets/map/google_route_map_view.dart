import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/theme.dart';
import '../../data/city_coordinates.dart';
import '../../data/city_routes.dart';

class GoogleRouteMapView extends StatefulWidget {
  final String origin;
  final String destination;
  final double progress; // 0.0 to 1.0
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

class _GoogleRouteMapViewState extends State<GoogleRouteMapView>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
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
    _mapController?.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(GoogleRouteMapView old) {
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
    if (_mapController == null || _routePoints.isEmpty) return;
    var minLat = 90.0, maxLat = -90.0, minLon = 180.0, maxLon = -180.0;
    for (final pt in _routePoints) {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lon < minLon) minLon = pt.lon;
      if (pt.lon > maxLon) maxLon = pt.lon;
    }
    // Expand tiny single-city bounds so the camera doesn't crash
    if (maxLat - minLat < 0.01) {
      minLat -= 0.05;
      maxLat += 0.05;
    }
    if (maxLon - minLon < 0.01) {
      minLon -= 0.05;
      maxLon += 0.05;
    }
    try {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat, minLon),
            northeast: LatLng(maxLat, maxLon),
          ),
          48.0,
        ),
      );
    } catch (_) {}
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
        startCap: Cap.roundCap,
        endCap: Cap.roundCap,
        jointType: JointType.round,
      ),
    };
  }

  Set<Marker> _buildMarkers(double progress) {
    if (_routePoints.isEmpty) return {};
    final markers = <Marker>{};

    markers.add(Marker(
      markerId: const MarkerId('start'),
      position: LatLng(_routePoints.first.lat, _routePoints.first.lon),
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
    ));
    markers.add(Marker(
      markerId: const MarkerId('end'),
      position: LatLng(_routePoints.last.lat, _routePoints.last.lon),
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
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
        markerId: const MarkerId('car'),
        position: LatLng(lat, lon),
        rotation: heading,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        anchor: const Offset(0.5, 0.5),
        flat: true,
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
              return GoogleMap(
                initialCameraPosition:
                    CameraPosition(target: initialPos, zoom: 8),
                polylines: _buildPolylines(),
                markers: _buildMarkers(_smoothProgress.value),
                myLocationEnabled: false,
                myLocationButtonEnabled: false,
                mapToolbarEnabled: false,
                zoomControlsEnabled: false,
                mapType: MapType.normal,
                onMapCreated: (controller) {
                  _mapController = controller;
                  Future.delayed(const Duration(milliseconds: 400), _fitBounds);
                },
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
