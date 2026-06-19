import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../shared/widgets/map/route_map_view.dart';
import '../bookings/data/bookings_controller.dart';
import 'data/trip_search_provider.dart';

class PassengerActiveRideScreen extends ConsumerStatefulWidget {
  final String bookingId;
  final String rideId;

  const PassengerActiveRideScreen({
    required this.bookingId,
    required this.rideId,
    super.key,
  });

  @override
  ConsumerState<PassengerActiveRideScreen> createState() => _PassengerActiveRideScreenState();
}

class _PassengerActiveRideScreenState extends ConsumerState<PassengerActiveRideScreen> {
  double _progress = 0.0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Simulate vehicle movement
    _timer = Timer.periodic(const Duration(milliseconds: 500), (timer) {
      if (!mounted) return;
      setState(() {
        _progress += 0.01;
        if (_progress > 1.0) _progress = 1.0;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final booking = ref.watch(bookingsControllerProvider).valueOrNull?.firstWhere((b) => b.id == widget.bookingId);
    
    if (booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Active Ride')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Background Map
          Positioned.fill(
            child: RouteMapView(
              origin: booking.fromCity,
              destination: booking.toCity,
              progress: _progress,
              showCar: true,
              preferGoogleMap: false, // forces Leaflet (flutter_map) for guaranteed free display
            ),
          ),
          
          // Back Button Overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: CircleAvatar(
              backgroundColor: Colors.white,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppTheme.navy),
                onPressed: () => context.pop(),
              ),
            ),
          ),
          
          // Bottom Sheet Overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2))
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.slate200, borderRadius: BorderRadius.circular(2))),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.teal.withOpacity(0.2),
                          child: const Icon(Icons.person, color: AppTheme.tealDark),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(booking.driverName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.navy)),
                              const Text('Sürücü yoldadır', style: TextStyle(color: AppTheme.tealDark, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('ETA', style: TextStyle(color: AppTheme.slate500, fontSize: 12)),
                            Text('${((1.0 - _progress) * 60).clamp(1, 60).toInt()} min', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.navy)),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // Complete demo
                          context.pop();
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.teal, foregroundColor: Colors.white),
                        icon: const Icon(Icons.check_circle_outline),
                        label: const Text('Mən çatdım (Demo End)'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
