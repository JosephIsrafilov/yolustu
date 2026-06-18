import 'package:flutter/material.dart';
import 'package:google_api_availability/google_api_availability.dart';

import 'google_route_map_view.dart';
import 'leaflet_route_map_view.dart';

class AdaptiveRouteMapView extends StatefulWidget {
  final String origin;
  final String destination;
  final double progress;
  final bool showCar;
  final bool preferGoogleMap;

  const AdaptiveRouteMapView({
    required this.origin,
    required this.destination,
    this.progress = 0.0,
    this.showCar = false,
    this.preferGoogleMap = true,
    super.key,
  });

  @override
  State<AdaptiveRouteMapView> createState() => _AdaptiveRouteMapViewState();
}

class _AdaptiveRouteMapViewState extends State<AdaptiveRouteMapView> {
  bool? _isGooglePlayServicesAvailable;

  @override
  void initState() {
    super.initState();
    _checkGooglePlayServices();
  }

  Future<void> _checkGooglePlayServices() async {
    try {
      final availability = await GoogleApiAvailability.instance
          .checkGooglePlayServicesAvailability();
      setState(() {
        _isGooglePlayServicesAvailable =
            availability == GooglePlayServicesAvailability.success;
      });
    } catch (_) {
      setState(() {
        _isGooglePlayServicesAvailable = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isGooglePlayServicesAvailable == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (widget.preferGoogleMap && _isGooglePlayServicesAvailable!) {
      return GoogleRouteMapView(
        origin: widget.origin,
        destination: widget.destination,
        progress: widget.progress,
        showCar: widget.showCar,
      );
    } else {
      return LeafletRouteMapView(
        origin: widget.origin,
        destination: widget.destination,
        progress: widget.progress,
        showCar: widget.showCar,
      );
    }
  }
}
