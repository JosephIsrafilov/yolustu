import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/status_badge.dart';
import '../chat/data/chat_repository.dart';
import 'data/driver_ride.dart';
import 'data/driver_controller.dart';

/// Incoming passenger booking requests against the driver's rides.
class PassengerRequestsScreen extends ConsumerWidget {
  const PassengerRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final requestsAsync = ref.watch(passengerRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.passengerRequestsTitle)),
      body: requestsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (requests) => requests.isEmpty
            ? EmptyState(
                icon: Icons.inbox_outlined,
                title: l10n.passengerRequestsEmpty,
                message: l10n.passengerRequestsEmptyMessage,
                actionLabel: l10n.commonBack,
                onAction: () => Navigator.of(context).maybePop(),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppConstants.spacing16),
                itemCount: requests.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) => _RequestCard(request: requests[i]),
              ),
      ),
    );
  }
}

class _RequestCard extends ConsumerStatefulWidget {
  final PassengerRequest request;

  const _RequestCard({required this.request});

  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _busy = false;

  Future<void> _setStatus(RequestStatus status) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(passengerRequestsProvider.notifier)
          .setStatus(widget.request.id, status);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(status.label)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openChat() async {
    setState(() => _busy = true);
    try {
      final conversation =
          await ref.read(chatRepositoryProvider).getOrCreateRideConversation(
                rideId: widget.request.rideId.isEmpty
                    ? null
                    : widget.request.rideId,
                bookingId: widget.request.id,
              );
      if (mounted) context.push('${AppRoutes.messages}/${conversation.id}');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final request = widget.request;
    final time =
        '${request.departureTime.hour.toString().padLeft(2, '0')}:${request.departureTime.minute.toString().padLeft(2, '0')}';

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
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                child: Text(
                  request.passengerName[0],
                  style: const TextStyle(
                    color: AppTheme.tealDark,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.passengerName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          request.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.slate500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (request.status != RequestStatus.pending)
                StatusBadge(
                  label: request.status.label,
                  backgroundColor: request.status.colors.$1,
                  foregroundColor: request.status.colors.$2,
                ),
              if (request.status != RequestStatus.rejected)
                IconButton(
                  onPressed: _busy ? null : _openChat,
                  icon: const Icon(Icons.chat_bubble_outline),
                  color: AppTheme.tealDark,
                  tooltip: 'Söhbət',
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.route_outlined, size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: Text('${request.fromCity} → ${request.toCity}'),
              ),
              const Icon(Icons.access_time, size: 16),
              const SizedBox(width: 6),
              Text(time),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.event_seat, size: 16, color: AppTheme.slate500),
              const SizedBox(width: 6),
              Text('${request.seats} ${l10n.passengerRequestsSeatsLabel}',
                  style: const TextStyle(color: AppTheme.slate500)),
            ],
          ),
          if (request.status == RequestStatus.pending) ...[
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed:
                        _busy ? null : () => _setStatus(RequestStatus.rejected),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade600,
                      side: BorderSide(color: Colors.red.shade200),
                    ),
                    child: Text(l10n.passengerRequestsReject),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed:
                        _busy ? null : () => _setStatus(RequestStatus.accepted),
                    child: Text(l10n.passengerRequestsAccept),
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
