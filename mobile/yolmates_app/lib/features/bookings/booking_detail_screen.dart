import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/widgets/error_state.dart';
import '../reviews/presentation/review_dialog.dart';
import 'data/booking.dart';
import 'data/bookings_controller.dart';

/// Detail view for a single booking.
///
/// Reads the booking reactively from [bookingsControllerProvider]; exposes
/// cancel and (when confirmed) a mock payment action.
class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({required this.bookingId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(
      bookingsControllerProvider.select((s) {
        final list = s.valueOrNull;
        if (list == null) return null;
        for (final b in list) {
          if (b.id == bookingId) return b;
        }
        return null;
      }),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Rezervasiya detalları')),
      body: booking == null
          ? ErrorStateView(
              title: 'Rezervasiya tapılmadı',
              onRetry: () => context.pop(),
              retryLabel: 'Geri qayıt',
            )
          : _Detail(booking: booking),
    );
  }
}

class _Detail extends ConsumerStatefulWidget {
  final Booking booking;

  const _Detail({required this.booking});

  @override
  ConsumerState<_Detail> createState() => _DetailState();
}

class _DetailState extends ConsumerState<_Detail> {
  bool _busy = false;

  Future<void> _setStatus(BookingStatus status) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(bookingsControllerProvider.notifier)
          .setStatus(widget.booking.id, status);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rezervasiyanı ləğv et'),
        content: const Text('Bu rezervasiyanı ləğv etmək istəyirsiniz?'),
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
    if (ok == true) await _setStatus(BookingStatus.cancelled);
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.booking;
    final time =
        '${b.departureTime.hour.toString().padLeft(2, '0')}:${b.departureTime.minute.toString().padLeft(2, '0')}';
    final date =
        '${b.departureTime.day}.${b.departureTime.month}.${b.departureTime.year}';

    return ListView(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${b.fromCity} → ${b.toCity}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            _StatusBadge(status: b.status),
          ],
        ),
        const SizedBox(height: 20),
        _InfoCard(
          rows: [
            _InfoRow(Icons.calendar_today, 'Tarix', date),
            _InfoRow(Icons.access_time, 'Vaxt', time),
            _InfoRow(Icons.person, 'Sürücü', b.driverName),
            _InfoRow(Icons.event_seat, 'Yerlər', '${b.seats}'),
            _InfoRow(Icons.payments_outlined, 'Cəmi',
                '${b.total.toStringAsFixed(0)} AZN'),
          ],
        ),
        const SizedBox(height: 20),
        _Timeline(status: b.status),
        const SizedBox(height: 24),
        // Chat button - only show for confirmed/paid bookings in mock mode
        // In API mode, chat not implemented yet
        if (b.status == BookingStatus.confirmed || b.status == BookingStatus.paid) ...[
          SizedBox(
            height: 52,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/messages/conv-${b.rideId}'),
              icon: const Icon(Icons.message_outlined),
              label: const Text('Sürücüyə yaz'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.slate500,
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        // Review button - show when completed
        if (b.status == BookingStatus.completed) ...[
          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () => ReviewDialog.show(
                context,
                targetId: b.driverId,
                rideId: b.rideId,
                targetName: b.driverName,
              ),
              icon: const Icon(Icons.star),
              label: const Text('Sürücüyə rəy bildir'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.teal,
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        // Cancel button - only for active bookings
        if (b.status.isActive) ...[
          SizedBox(
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _busy ? null : _cancel,
              icon: const Icon(Icons.cancel_outlined),
              label: const Text('Rezervasiyanı ləğv et'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red.shade600,
              ),
            ),
          ),
        ],
        // Back to bookings button - always visible
        const SizedBox(height: 12),
        SizedBox(
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => context.go('/bookings'),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Rezervasiyalara qayıt'),
          ),
        ),
      ],
    );
  }
}

class _InfoRow {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(this.icon, this.label, this.value);
}

class _InfoCard extends StatelessWidget {
  final List<_InfoRow> rows;
  const _InfoCard({required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            Row(
              children: [
                Icon(rows[i].icon, size: 20, color: AppTheme.slate500),
                const SizedBox(width: 12),
                Text(rows[i].label, style: TextStyle(color: AppTheme.slate500)),
                const Spacer(),
                Text(rows[i].value,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ],
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.label,
        style: TextStyle(color: fg, fontSize: 13, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  final BookingStatus status;
  const _Timeline({required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = ['Göndərildi', 'Təsdiq', 'Ödəniş', 'Tamamlandı'];
    final reached = switch (status) {
      BookingStatus.pending => 1,
      BookingStatus.confirmed => 2,
      BookingStatus.paid => 3,
      BookingStatus.completed => 4,
      BookingStatus.rejected => 1,
      BookingStatus.cancelled => 1,
    };
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
          Text(
            'Tarixçə',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.slate500,
            ),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < steps.length; i++) ...[
            if (i > 0) const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  i < reached
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  size: 20,
                  color: i < reached ? AppTheme.tealDark : AppTheme.slate200,
                ),
                const SizedBox(width: 12),
                Text(
                  steps[i],
                  style: TextStyle(
                    color: i < reached ? AppTheme.navy : AppTheme.slate500,
                    fontWeight:
                        i < reached ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
