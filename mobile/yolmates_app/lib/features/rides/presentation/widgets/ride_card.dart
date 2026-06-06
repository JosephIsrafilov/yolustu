import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/app_card.dart';
import '../../../../shared/models/ride.dart';
import '../../../../shared/widgets/price_text.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/user_avatar.dart';

class RideCard extends StatelessWidget {
  const RideCard({
    required this.ride,
    super.key,
  });

  final Ride ride;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => context.push('/rides/${ride.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                UserAvatar(user: ride.driver),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        '${ride.fromCity} -> ${ride.toCity}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text('${ride.driver.fullName}  •  ${ride.driver.rating.toStringAsFixed(1)}'),
                    ],
                  ),
                ),
                StatusBadge(
                  label: ride.status.name,
                  color: _statusColor(context, ride.status.name),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: <Widget>[
                _MetaChip(icon: Icons.schedule, label: _formatRideDate(ride)),
                _MetaChip(
                  icon: Icons.event_seat_outlined,
                  label: '${ride.availableSeats}/${ride.totalSeats} seats',
                ),
                _MetaChip(icon: Icons.place_outlined, label: ride.meetingPoint),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Expanded(
                  child: Text(
                    ride.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                PriceText(ride.priceAzn),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatRideDate(Ride ride) {
    final date = ride.departureTime;
    return '${date.day}.${date.month} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  Color _statusColor(BuildContext context, String status) {
    switch (status) {
      case 'active':
        return Theme.of(context).colorScheme.primary;
      case 'accepted':
      case 'paid':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      default:
        return Theme.of(context).colorScheme.secondary;
    }
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 16),
          const SizedBox(width: 6),
          Text(label),
        ],
      ),
    );
  }
}
