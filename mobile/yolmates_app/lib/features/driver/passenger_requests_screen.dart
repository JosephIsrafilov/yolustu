import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/status_badge.dart';
import 'data/driver_ride.dart';
import 'data/driver_controller.dart';

/// Incoming passenger booking requests against the driver's rides.
class PassengerRequestsScreen extends ConsumerWidget {
  const PassengerRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(passengerRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sərnişin sorğuları')),
      body: requests.isEmpty
          ? const EmptyState(
              icon: Icons.inbox_outlined,
              title: 'Sorğu yoxdur',
              message: 'Yeni sərnişin sorğuları burada görünəcək.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              itemCount: requests.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _RequestCard(request: requests[i]),
            ),
    );
  }
}

class _RequestCard extends ConsumerWidget {
  final PassengerRequest request;

  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                          style: TextStyle(
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
              Text('${request.seats} yer',
                  style: TextStyle(color: AppTheme.slate500)),
            ],
          ),
          if (request.status == RequestStatus.pending) ...[
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => ref
                        .read(passengerRequestsProvider.notifier)
                        .setStatus(request.id, RequestStatus.rejected),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red.shade600,
                      side: BorderSide(color: Colors.red.shade200),
                    ),
                    child: const Text('Rədd et'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => ref
                        .read(passengerRequestsProvider.notifier)
                        .setStatus(request.id, RequestStatus.accepted),
                    child: const Text('Qəbul et'),
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

