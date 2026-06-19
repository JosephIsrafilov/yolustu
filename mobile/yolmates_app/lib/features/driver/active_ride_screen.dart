import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../shared/widgets/status_badge.dart';
import '../trips/data/ride_tracking_repository.dart';
import '../../shared/widgets/map/route_map_view.dart';
import 'data/driver_controller.dart';
import 'data/driver_ride.dart';

/// Active driver ride tracking dashboard.
///
/// Features:
/// - Real-time simulated movement tracking using a CustomPainter canvas map.
/// - Ride lifecycle transitions: start trip, complete trip.
/// - ETA calculations.
class ActiveRideScreen extends ConsumerStatefulWidget {
  final String rideId;

  const ActiveRideScreen({required this.rideId, super.key});

  @override
  ConsumerState<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends ConsumerState<ActiveRideScreen> {
  StreamSubscription<TrackingLocation>? _trackingSubscription;
  double _progress = 0.0;
  double _etaMinutes = 240.0;

  @override
  void dispose() {
    _stopTracking();
    super.dispose();
  }

  void _startTracking(DriverRide ride) {
    _stopTracking();

    // TODO: Adapter Layer: currently source = mock progress stream.
    // In production, change to real GPS / WebSocket repository source.
    final trackingRepo = MockRideTrackingRepository();
    _trackingSubscription = trackingRepo
        .trackRide(ride.id, ride.fromCity, ride.toCity)
        .listen((loc) {
      if (mounted) {
        setState(() {
          _progress = loc.progress;
          _etaMinutes = loc.etaMinutes;
        });
      }
    });
  }

  void _stopTracking() {
    _trackingSubscription?.cancel();
    _trackingSubscription = null;
  }

  Future<void> _startRide(DriverRide ride) async {
    await ref
        .read(driverRidesProvider.notifier)
        .setStatus(ride.id, DriverRideStatus.active);
    _startTracking(ride);
  }

  Future<void> _completeRide(DriverRide ride) async {
    final l10n = ref.read(l10nProvider);
    _stopTracking();
    await ref
        .read(driverRidesProvider.notifier)
        .setStatus(ride.id, DriverRideStatus.completed);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.activeRideCompleted)),
      );
    }
  }

  Future<void> _shareTrip(DriverRide ride) async {
    final l10n = ref.read(l10nProvider);
    final time =
        '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';
    final date =
        '${ride.departureTime.day}.${ride.departureTime.month}.${ride.departureTime.year}';

    final shareText = '''
Yolmates Səfər Məlumatı

Marşrut: ${ride.fromCity} → ${ride.toCity}
Tarix: $date, Saat: $time
Səfər ID: ${ride.id}

Təhlükəsizlik qeydi: Bu səfər Yolmates platforması vasitəsilə edilir.
Təcili yardım: 112
''';

    await Clipboard.setData(ClipboardData(text: shareText.trim()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.safetyShareCopied)),
      );
    }
  }

  Future<void> _showSOSDialog(DriverRide ride) async {
    final l10n = ref.read(l10nProvider);

    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.safetySOSConfirmTitle),
        content: Text(l10n.safetySOSConfirmMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, 'cancel'),
            child: Text(l10n.safetyCancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, 'copy'),
            child: Text(l10n.safetySOSCopy),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, 'call'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
            child: Text(l10n.safetySOSCall),
          ),
        ],
      ),
    );

    if (!mounted) return;

    if (result == 'copy' || result == 'call') {
      await _shareTrip(ride);
    }

    if (result == 'call') {
      final uri = Uri.parse('tel:112');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    // Watch current rides
    final ridesAsync = ref.watch(driverRidesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.activeRideTitle)),
      body: ridesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('${l10n.activeRideError}: $e')),
        data: (rides) {
          // Find the ride or generate a fallback mock one if not found (e.g. direct deep link)
          DriverRide? ride;
          try {
            ride = rides.firstWhere((r) => r.id == widget.rideId);
          } catch (_) {
            ride = DriverRide(
              id: widget.rideId,
              fromCity: 'Bakı',
              toCity: 'Gəncə',
              departureTime: DateTime.now().add(const Duration(hours: 2)),
              seats: 3,
              pricePerSeat: 15.0,
              status: DriverRideStatus.upcoming,
            );
          }

          // Auto-start tracking if ride is already active and stream is not listening yet
          if (ride.status == DriverRideStatus.active &&
              _trackingSubscription == null) {
            _startTracking(ride);
          }

          final label = _mapStatusLabel(ride.status);
          final time =
              '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';

          return Column(
            children: [
              // Dynamic Canvas Map
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.spacing16),
                  child: RouteMapView(
                    origin: ride.fromCity,
                    destination: ride.toCity,
                    progress: _progress,
                    showCar: ride.status == DriverRideStatus.active,
                    preferGoogleMap: false,
                  ),
                ),
              ),
              // Dashboard Panel
              Expanded(
                flex: 2,
                child: Container(
                  padding: const EdgeInsets.all(AppConstants.spacing24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 16,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${ride.fromCity} → ${ride.toCity}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.navy,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Çıxış vaxtı: $time',
                                style: TextStyle(
                                    color: AppTheme.slate500, fontSize: 13),
                              ),
                            ],
                          ),
                          StatusBadge(
                            label: label,
                            backgroundColor: ride.status.colors.$1,
                            foregroundColor: ride.status.colors.$2,
                          ),
                        ],
                      ),
                      const Spacer(),
                      if (ride.status == DriverRideStatus.active) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Çatma vaxtı (ETA):',
                              style: TextStyle(
                                  color: AppTheme.slate700, fontSize: 14),
                            ),
                            Text(
                              '~${_etaMinutes.toStringAsFixed(0)} dəqiqə',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.tealDark,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: _progress,
                          color: AppTheme.teal,
                          backgroundColor: AppTheme.slate100,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Səyahət tərəqqisi: ${(_progress * 100).toStringAsFixed(0)}%',
                          textAlign: TextAlign.left,
                          style:
                              TextStyle(fontSize: 12, color: AppTheme.slate500),
                        ),
                      ],
                      const Spacer(),
                      // Safety Section (active rides only)
                      if (ride.status == DriverRideStatus.active) ...[
                        Container(
                          padding: const EdgeInsets.all(AppConstants.spacing12),
                          decoration: BoxDecoration(
                            color: AppTheme.slate50,
                            borderRadius: BorderRadius.circular(
                                AppConstants.borderRadius12),
                            border: Border.all(color: AppTheme.slate200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.shield_outlined,
                                      size: 18, color: AppTheme.tealDark),
                                  const SizedBox(width: 8),
                                  Text(
                                    l10n.safetyTitle,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.navy,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _shareTrip(ride!),
                                      icon: const Icon(Icons.share, size: 18),
                                      label: Text(l10n.safetyShareTrip),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 12),
                                        side: BorderSide(color: AppTheme.teal),
                                        foregroundColor: AppTheme.tealDark,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _showSOSDialog(ride!),
                                      icon: const Icon(Icons.warning_amber,
                                          size: 18),
                                      label: Text(l10n.safetySOS),
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 12),
                                        side: BorderSide(
                                            color: Colors.red.shade300),
                                        foregroundColor: Colors.red.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Lifecycle Actions
                      if (ride.status == DriverRideStatus.upcoming)
                        SizedBox(
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: () => _startRide(ride!),
                            icon: const Icon(Icons.play_arrow),
                            label: Text(l10n.activeRideStartButton),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.teal,
                            ),
                          ),
                        )
                      else if (ride.status == DriverRideStatus.active)
                        SizedBox(
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: () => _completeRide(ride!),
                            icon: const Icon(Icons.done_all),
                            label: Text(l10n.activeRideCompleteButton),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade600,
                            ),
                          ),
                        )
                      else
                        SizedBox(
                          height: 52,
                          child: OutlinedButton(
                            onPressed: () => context.pop(),
                            child: Text(l10n.activeRideGoBack),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _mapStatusLabel(DriverRideStatus status) {
    switch (status) {
      case DriverRideStatus.upcoming:
        return 'Planlaşdırılır (Sifarişlər Qəbul Edilir)';
      case DriverRideStatus.active:
        return 'Səfər Başladı';
      case DriverRideStatus.completed:
        return 'Səfər Tamamlandı';
      case DriverRideStatus.cancelled:
        return 'Səfər Ləğv Edildi';
    }
  }
}
