import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/repositories/rides_repository.dart';
import '../../shared/models/trip.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';

/// Search results for a route, backed by [rideSearchProvider].
///
/// Supports client-side sort (time/price) and a verified-only filter. Shows
/// loading, empty and error states from the shared widgets.
class TripListScreen extends ConsumerStatefulWidget {
  final String fromCity;
  final String toCity;
  final int passengers;

  const TripListScreen({
    required this.fromCity,
    required this.toCity,
    this.passengers = 1,
    super.key,
  });

  @override
  ConsumerState<TripListScreen> createState() => _TripListScreenState();
}

enum _Sort { timeAsc, priceAsc }

class _TripListScreenState extends ConsumerState<TripListScreen> {
  _Sort _sort = _Sort.timeAsc;
  bool _verifiedOnly = false;

  @override
  Widget build(BuildContext context) {
    final params = RideSearchParams(
      fromCity: widget.fromCity,
      toCity: widget.toCity,
      passengers: widget.passengers,
    );
    final ridesAsync = ref.watch(rideSearchProvider(params));

    return Scaffold(
      appBar: AppBar(title: Text('${widget.fromCity} → ${widget.toCity}')),
      body: ridesAsync.when(
        loading: () => const LoadingView(message: 'Səyahətlər axtarılır...'),
        error: (e, _) => ErrorStateView(
          title: 'Axtarış alınmadı',
          message: e.toString(),
          onRetry: () => ref.invalidate(rideSearchProvider(params)),
        ),
        data: (rides) => _buildResults(context, rides),
      ),
    );
  }

  Widget _buildResults(BuildContext context, List<Trip> rides) {
    final filtered = _verifiedOnly
        ? rides.where((r) => r.driver.rating >= 4.7).toList()
        : [...rides];
    switch (_sort) {
      case _Sort.timeAsc:
        filtered.sort((a, b) => a.departureTime.compareTo(b.departureTime));
      case _Sort.priceAsc:
        filtered.sort((a, b) => a.price.compareTo(b.price));
    }

    return Column(
      children: [
        _FilterBar(
          sort: _sort,
          verifiedOnly: _verifiedOnly,
          onSort: (s) => setState(() => _sort = s),
          onVerified: (v) => setState(() => _verifiedOnly = v),
        ),
        Expanded(
          child: filtered.isEmpty
              ? const EmptyState(
                  icon: Icons.search_off,
                  title: 'Səyahət tapılmadı',
                  message: 'Bu marşrut üçün uyğun reis yoxdur. '
                      'Filtri dəyişin və ya başqa tarix seçin.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(AppConstants.spacing16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) => _TripCard(trip: filtered[i]),
                ),
        ),
      ],
    );
  }
}

class _FilterBar extends StatelessWidget {
  final _Sort sort;
  final bool verifiedOnly;
  final ValueChanged<_Sort> onSort;
  final ValueChanged<bool> onVerified;

  const _FilterBar({
    required this.sort,
    required this.verifiedOnly,
    required this.onSort,
    required this.onVerified,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.slate200)),
      ),
      child: Row(
        children: [
          _chip(
            label: 'Vaxt',
            selected: sort == _Sort.timeAsc,
            onTap: () => onSort(_Sort.timeAsc),
          ),
          const SizedBox(width: 8),
          _chip(
            label: 'Qiymət',
            selected: sort == _Sort.priceAsc,
            onTap: () => onSort(_Sort.priceAsc),
          ),
          const Spacer(),
          _chip(
            label: 'Yoxlanılmış',
            icon: Icons.verified,
            selected: verifiedOnly,
            onTap: () => onVerified(!verifiedOnly),
          ),
        ],
      ),
    );
  }

  Widget _chip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
    IconData? icon,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color:
              selected ? AppTheme.teal.withValues(alpha: 0.12) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppTheme.teal : AppTheme.slate200,
          ),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon,
                  size: 14,
                  color: selected ? AppTheme.tealDark : AppTheme.slate500),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? AppTheme.tealDark : AppTheme.slate700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  final Trip trip;

  const _TripCard({required this.trip});

  @override
  Widget build(BuildContext context) {
    final time =
        '${trip.departureTime.hour.toString().padLeft(2, '0')}:${trip.departureTime.minute.toString().padLeft(2, '0')}';

    return InkWell(
      onTap: () => context.push('${AppRoutes.rideDetails}/${trip.id}'),
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
              children: [
                CircleAvatar(
                  backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                  child: Text(
                    trip.driver.name[0],
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
                        trip.driver.name,
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
                            '${trip.driver.rating.toStringAsFixed(1)} · ${trip.driver.tripCount} səyahət',
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
                Text(
                  '${trip.price.toStringAsFixed(0)} AZN',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.tealDark,
                  ),
                ),
              ],
            ),
            Divider(height: 24, color: AppTheme.slate100),
            Row(
              children: [
                const Icon(Icons.access_time, size: 18),
                const SizedBox(width: 8),
                Text(time, style: const TextStyle(fontSize: 15)),
                const SizedBox(width: 24),
                const Icon(Icons.event_seat, size: 18),
                const SizedBox(width: 8),
                Text('${trip.availableSeats} boş yer',
                    style: const TextStyle(fontSize: 15)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
