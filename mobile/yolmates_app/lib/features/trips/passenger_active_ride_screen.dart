import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';
import '../../shared/widgets/map/route_map_view.dart';
import '../bookings/data/booking.dart';
import '../bookings/data/bookings_controller.dart';
import '../notifications/notification_provider.dart';
import '../reviews/presentation/review_dialog.dart';
import 'ride_lifecycle.dart';

class PassengerActiveRideScreen extends ConsumerStatefulWidget {
  final String bookingId;
  final String rideId;

  const PassengerActiveRideScreen({
    required this.bookingId,
    required this.rideId,
    super.key,
  });

  @override
  ConsumerState<PassengerActiveRideScreen> createState() =>
      _PassengerActiveRideScreenState();
}

class _PassengerActiveRideScreenState
    extends ConsumerState<PassengerActiveRideScreen> {
  double _progress = 0.0;
  Timer? _timer;
  bool _arrivalNoticeShown = false;
  bool _reviewSubmitted = false;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 500), (timer) {
      if (!mounted) return;
      setState(() {
        _progress += 0.01;
        if (_progress > 1.0) _progress = 1.0;
      });
      _maybeNotifyFinishAvailable();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _maybeNotifyFinishAvailable() {
    if (_arrivalNoticeShown) return;
    _arrivalNoticeShown = true;
    ref
        .read(notificationProvider.notifier)
        .showInfo('Arrival confirmation is ready for this demo ride.');
  }

  Future<void> _confirmArrival(Booking booking) async {
    if (_busy || _reviewSubmitted) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(bookingsControllerProvider.notifier)
          .setStatus(booking.id, BookingStatus.completed);
      if (!mounted) return;
      ref
          .read(notificationProvider.notifier)
          .showSuccess('Ride completed. Reserved funds were released.');
      await ReviewDialog.show(
        context,
        targetId: booking.driverId.isEmpty ? booking.rideId : booking.driverId,
        rideId: booking.rideId,
        targetName: booking.driverName,
      );
    } catch (e) {
      if (!mounted) return;
      ref.read(notificationProvider.notifier).showError('Xeta: $e');
      return;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
    if (!mounted) return;
    _reviewSubmitted = true;
    context.go('/bookings');
  }

  @override
  Widget build(BuildContext context) {
    final bookings = ref.watch(bookingsControllerProvider).valueOrNull;
    Booking? booking;
    if (bookings != null) {
      for (final candidate in bookings) {
        if (candidate.id == widget.bookingId) {
          booking = candidate;
          break;
        }
      }
    }

    if (booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Active Ride')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final currentBooking = booking;

    final remaining = RideLifecycle.remainingFromProgress(progress: _progress);
    final canFinish = RideLifecycle.canConfirmPassengerArrival();
    final etaMinutes = remaining.inMinutes.clamp(0, 60);

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: RouteMapView(
              origin: currentBooking.fromCity,
              destination: currentBooking.toCity,
              progress: _progress,
              showCar: true,
              preferGoogleMap: false,
            ),
          ),
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
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, -2),
                  )
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.slate200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.teal.withValues(alpha: 0.1),
                          child: const Icon(
                            Icons.person,
                            color: AppTheme.tealDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currentBooking.driverName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.navy,
                                ),
                              ),
                              Text(
                                canFinish
                                    ? 'Destination reached'
                                    : 'Ride in progress',
                                style: const TextStyle(
                                  color: AppTheme.tealDark,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'ETA',
                              style: TextStyle(
                                color: AppTheme.slate500,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              '${etaMinutes == 0 ? 1 : etaMinutes} min',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.navy,
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 18),
                    LinearProgressIndicator(
                      value: _progress,
                      color: AppTheme.teal,
                      backgroundColor: AppTheme.slate100,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      canFinish
                          ? 'Arrival confirmation is available'
                          : 'Arrival confirmation unlocks near destination.',
                      style: TextStyle(
                        color:
                            canFinish ? AppTheme.tealDark : AppTheme.slate500,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: canFinish && !_reviewSubmitted && !_busy
                            ? () => _confirmArrival(currentBooking)
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.teal,
                          foregroundColor: Colors.white,
                        ),
                        icon: _busy
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.check_circle_outline),
                        label: Text(
                          _reviewSubmitted ? 'Reviewed' : 'Men catdim',
                        ),
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
