import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import 'data/booking.dart';
import 'data/bookings_controller.dart';

/// Reservations tab.
///
/// Reactive list from [bookingsControllerProvider]; shows shared
/// loading/error/empty states and routes each card to its detail screen.
class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rezervasiyalarım')),
      body: bookingsAsync.when(
        loading: () => const LoadingView(message: 'Yüklənir...'),
        error: (e, _) => ErrorStateView(
          title: 'Yüklənmədi',
          message: e.toString(),
          onRetry: () =>
              ref.read(bookingsControllerProvider.notifier).refresh(),
        ),
        data: (bookings) {
          if (bookings.isEmpty) {
            return EmptyState(
              icon: Icons.confirmation_number_outlined,
              title: 'Hələ rezervasiya yoxdur',
              message: 'Səyahət axtarın və ilk rezervasiyanızı edin.',
              actionLabel: 'Gediş axtar',
              onAction: () => context.go(AppRoutes.search),
            );
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(bookingsControllerProvider.notifier).refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              itemCount: bookings.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _BookingCard(booking: bookings[i]),
            ),
          );
        },
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;

  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context) {
    final time =
        '${booking.departureTime.hour.toString().padLeft(2, '0')}:${booking.departureTime.minute.toString().padLeft(2, '0')}';
    final date =
        '${booking.departureTime.day}.${booking.departureTime.month}.${booking.departureTime.year}';

    return InkWell(
      onTap: () => context.push('${AppRoutes.bookings}/${booking.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
                    '${booking.fromCity} → ${booking.toCity}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _StatusBadge(status: booking.status),
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
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.person, size: 16, color: AppTheme.slate500),
                const SizedBox(width: 6),
                Text(
                  booking.driverName,
                  style: TextStyle(color: AppTheme.slate500),
                ),
                const Spacer(),
                Text(
                  '${booking.total.toStringAsFixed(0)} AZN',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.tealDark,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final BookingStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      BookingStatus.pending => (Colors.orange.shade50, Colors.orange.shade700),
      BookingStatus.confirmed => (
          AppTheme.teal.withValues(alpha: 0.1),
          AppTheme.tealDark
        ),
      BookingStatus.paid => (Colors.green.shade50, Colors.green.shade700),
      BookingStatus.completed => (AppTheme.slate100, AppTheme.slate700),
      BookingStatus.rejected => (Colors.red.shade50, Colors.red.shade700),
      BookingStatus.cancelled => (Colors.red.shade50, Colors.red.shade700),
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
