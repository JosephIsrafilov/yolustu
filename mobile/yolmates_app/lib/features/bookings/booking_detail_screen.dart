import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/status_badge.dart';
import '../chat/data/chat_repository.dart';
import '../chat/data/chat_controller.dart';
import '../reviews/presentation/review_dialog.dart';
import 'data/booking.dart';
import 'data/bookings_controller.dart';

final _reviewPromptedBookingsProvider = StateProvider<Set<String>>((ref) => {});

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;

  const BookingDetailScreen({required this.bookingId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
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
      appBar: AppBar(title: Text(l10n.bookingDetailTitle)),
      body: booking == null
          ? ErrorStateView(
              title: l10n.bookingDetailNotFound,
              onRetry: () => context.pop(),
              retryLabel: l10n.bookingDetailGoBack,
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

  @override
  void initState() {
    super.initState();
    if (widget.booking.status == BookingStatus.completed) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _maybePromptReview());
    }
  }

  void _maybePromptReview() {
    final prompted = ref.read(_reviewPromptedBookingsProvider);
    if (prompted.contains(widget.booking.id)) return;

    ref.read(_reviewPromptedBookingsProvider.notifier).state = {
      ...prompted,
      widget.booking.id,
    };

    ReviewDialog.show(
      context,
      targetId: widget.booking.driverId,
      rideId: widget.booking.rideId,
      targetName: widget.booking.driverName,
    );
  }

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

  Future<void> _startChat() async {
    setState(() => _busy = true);
    try {
      final repo = ref.read(chatRepositoryProvider);
      final conversation =
          await repo.getOrCreateRideConversation(widget.booking.rideId, bookingId: widget.booking.id);
      ref.invalidate(conversationsProvider);
      if (mounted) context.push('/messages/${conversation.id}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Xeta: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    final l10n = ref.read(l10nProvider);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.bookingDetailCancelTitle),
        content: Text(l10n.bookingDetailCancelMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(l10n.bookingDetailDismiss),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(
              l10n.bookingDetailCancelBtn,
              style: TextStyle(color: Colors.red.shade600),
            ),
          ),
        ],
      ),
    );
    if (ok == true) await _setStatus(BookingStatus.cancelled);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
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
            StatusBadge(
              label: b.status.label,
              backgroundColor: b.status.colors.$1,
              foregroundColor: b.status.colors.$2,
            ),
          ],
        ),
        const SizedBox(height: 20),
        _InfoCard(
          rows: [
            _InfoRow(Icons.calendar_today, l10n.bookingDetailDate, date),
            _InfoRow(Icons.access_time, l10n.bookingDetailTime, time),
            _InfoRow(Icons.person, l10n.bookingDetailDriver, b.driverName),
            _InfoRow(Icons.event_seat, l10n.bookingDetailSeats, '${b.seats}'),
            _InfoRow(
              Icons.payments_outlined,
              l10n.bookingDetailTotal,
              '${b.total.toStringAsFixed(0)} AZN',
            ),
          ],
        ),
        const SizedBox(height: 20),
        _Timeline(status: b.status),
        const SizedBox(height: 24),
        if (b.status == BookingStatus.confirmed ||
            b.status == BookingStatus.paid) ...[
          SizedBox(
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _busy ? null : _startChat,
              icon: _busy
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.message_outlined),
              label: Text(l10n.bookingDetailMessageDriver),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.slate500,
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
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
              label: Text(l10n.bookingDetailLeaveReview),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.teal,
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (b.status.isActive) ...[
          SizedBox(
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _busy ? null : _cancel,
              icon: const Icon(Icons.cancel_outlined),
              label: Text(l10n.bookingDetailCancelTitle),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red.shade600,
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () => context.go('/bookings'),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Rezervasiyalara qayit'),
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
                Text(
                  rows[i].value,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  final BookingStatus status;

  const _Timeline({required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = ['Gonderildi', 'Tesdiq', 'Odenis', 'Tamamlandi'];
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
            'Tarixce',
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
