import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import 'data/driver_ride.dart';
import 'data/driver_controller.dart';

/// Driver's published rides, grouped by status with row actions.
class MyRidesScreen extends ConsumerWidget {
  const MyRidesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ridesAsync = ref.watch(driverRidesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Səfərlərim'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Yeni səfər',
            onPressed: () => context.push(AppRoutes.createRide),
          ),
        ],
      ),
      body: ridesAsync.when(
        loading: () => const LoadingView(message: 'Yüklənir...'),
        error: (e, _) => ErrorStateView(
          title: 'Yüklənmədi',
          message: e.toString(),
          onRetry: () => ref.invalidate(driverRidesProvider),
        ),
        data: (rides) {
          if (rides.isEmpty) {
            return EmptyState(
              icon: Icons.directions_car_outlined,
              title: 'Hələ səfər yoxdur',
              message: 'İlk səfərinizi yaradın və sərnişin tapın.',
              actionLabel: 'Səfər yarat',
              onAction: () => context.push(AppRoutes.createRide),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(driverRidesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              itemCount: rides.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _RideCard(ride: rides[i]),
            ),
          );
        },
      ),
    );
  }
}

class _RideCard extends ConsumerWidget {
  final DriverRide ride;

  const _RideCard({required this.ride});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final time =
        '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';
    final date =
        '${ride.departureTime.day}.${ride.departureTime.month}.${ride.departureTime.year}';

    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '${ride.fromCity} → ${ride.toCity}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              _StatusBadge(status: ride.status),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 16),
              const SizedBox(width: 6),
              Text(date),
              const SizedBox(width: 16),
              const Icon(Icons.access_time, size: 16),
              const SizedBox(width: 6),
              Text(time),
              const Spacer(),
              Text(
                '${ride.pricePerSeat.toStringAsFixed(0)} AZN',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.tealDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.event_seat, size: 16, color: AppTheme.slate500),
              const SizedBox(width: 6),
              Text('${ride.seats} yer',
                  style: TextStyle(color: AppTheme.slate500)),
            ],
          ),
          if (ride.status == DriverRideStatus.active ||
              ride.status == DriverRideStatus.upcoming) ...[
            const Divider(height: 24),
            Row(
              children: [
                _action(
                  icon: Icons.people_outline,
                  label: 'Sorğular',
                  onTap: () => context.push(AppRoutes.passengerRequests),
                ),
                _action(
                  icon: Icons.copy_outlined,
                  label: 'Dublikat',
                  onTap: () => _duplicate(context, ref),
                ),
                _action(
                  icon: Icons.close,
                  label: 'Ləğv et',
                  color: Colors.red.shade600,
                  onTap: () => _cancel(context, ref),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _action({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Icon(icon, size: 20, color: color ?? AppTheme.slate700),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: color ?? AppTheme.slate700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _duplicate(BuildContext context, WidgetRef ref) async {
    final copy = DriverRide(
      id: 'dr-${DateTime.now().millisecondsSinceEpoch}',
      fromCity: ride.fromCity,
      toCity: ride.toCity,
      departureTime: ride.departureTime.add(const Duration(days: 1)),
      seats: ride.seats,
      pricePerSeat: ride.pricePerSeat,
      allowLuggage: ride.allowLuggage,
      allowSmoking: ride.allowSmoking,
      allowMusic: ride.allowMusic,
      description: ride.description,
    );
    await ref.read(driverRidesProvider.notifier).publish(copy);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Səfər dublikat edildi')),
      );
    }
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Səfəri ləğv et'),
        content: const Text('Bu səfəri ləğv etmək istəyirsiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('İmtina'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child:
                Text('Ləğv et', style: TextStyle(color: Colors.red.shade600)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref
          .read(driverRidesProvider.notifier)
          .setStatus(ride.id, DriverRideStatus.cancelled);
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final DriverRideStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      DriverRideStatus.active => (
          AppTheme.teal.withValues(alpha: 0.1),
          AppTheme.tealDark
        ),
      DriverRideStatus.upcoming => (Colors.blue.shade50, Colors.blue.shade700),
      DriverRideStatus.completed => (AppTheme.slate100, AppTheme.slate700),
      DriverRideStatus.cancelled => (Colors.red.shade50, Colors.red.shade700),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
