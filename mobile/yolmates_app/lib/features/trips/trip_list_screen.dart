import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/repositories/rides_repository.dart';
import '../../shared/models/trip.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/skeleton_cards.dart';
import '../../shared/widgets/map/route_map_view.dart';

/// Search results for a route, backed by [rideSearchProvider].
///
/// Supports client-side sort (time/price) and a verified-only filter. Shows
/// loading, empty and error states from the shared widgets.
class TripListScreen extends ConsumerStatefulWidget {
  final String fromCity;
  final String toCity;
  final int passengers;
  final DateTime? date;

  const TripListScreen({
    required this.fromCity,
    required this.toCity,
    this.passengers = 1,
    this.date,
    super.key,
  });

  @override
  ConsumerState<TripListScreen> createState() => _TripListScreenState();
}

enum _Sort { timeAsc, priceAsc }

class _TripListScreenState extends ConsumerState<TripListScreen> {
  _Sort _sort = _Sort.timeAsc;
  bool _verifiedOnly = false;
  int _selectedIndex = 0;

  Future<void> _refresh(RideSearchParams params) async {
    ref.invalidate(rideSearchProvider(params));
    await ref.read(rideSearchProvider(params).future);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final params = RideSearchParams(
      fromCity: widget.fromCity,
      toCity: widget.toCity,
      passengers: widget.passengers,
    );
    final ridesAsync = ref.watch(rideSearchProvider(params));

    final dateLabel = widget.date != null
        ? ' · ${widget.date!.day}.${widget.date!.month}.${widget.date!.year}'
        : '';
    return Scaffold(
      appBar: AppBar(
          title: Text('${widget.fromCity} → ${widget.toCity}$dateLabel')),
      body: ridesAsync.when(
        loading: () => Column(
          children: [
            const SizedBox(height: 16),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(AppConstants.spacing16),
                itemCount: 4,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const TripCardSkeleton(),
              ),
            ),
          ],
        ),
        error: (e, _) => ErrorStateView(
          title: l10n.tripListSearchFailed,
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

    final activeIndex =
        _selectedIndex.clamp(0, filtered.isEmpty ? 0 : filtered.length - 1);
    final selectedTrip = filtered.isNotEmpty ? filtered[activeIndex] : null;

    return Column(
      children: [
        _FilterBar(
          sort: _sort,
          verifiedOnly: _verifiedOnly,
          onSort: (s) => setState(() => _sort = s),
          onVerified: (v) => setState(() => _verifiedOnly = v),
        ),
        if (selectedTrip != null) ...[
          Container(
            height: 180,
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slate200),
            ),
            clipBehavior: Clip.antiAlias,
            child: RouteMapView(
              origin: selectedTrip.fromCity,
              destination: selectedTrip.toCity,
            ),
          ),
        ],
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _refresh(
              RideSearchParams(
                fromCity: widget.fromCity,
                toCity: widget.toCity,
                passengers: widget.passengers,
              ),
            ),
            child: filtered.isEmpty
                ? EmptyState(
                    icon: Icons.search_off,
                    title: ref.read(l10nProvider).tripListNoResults,
                    message: ref.read(l10nProvider).tripListNoResultsMessage,
                    actionLabel: ref.read(l10nProvider).tripListModifySearch,
                    onAction: () => context.pop(),
                    scrollable: true,
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    padding: const EdgeInsets.all(AppConstants.spacing16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final isSelected = i == activeIndex;
                      return _TripCard(
                        trip: filtered[i],
                        isSelected: isSelected,
                        onTap: () {
                          if (isSelected) {
                            context.push(
                              '${AppRoutes.rideDetails}/${filtered[i].id}',
                            );
                          } else {
                            setState(() => _selectedIndex = i);
                          }
                        },
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }
}

class _FilterBar extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppTheme.slate200)),
      ),
      child: Row(
        children: [
          _chip(
            label: l10n.tripListSortTime,
            selected: sort == _Sort.timeAsc,
            onTap: () => onSort(_Sort.timeAsc),
          ),
          const SizedBox(width: 8),
          _chip(
            label: l10n.tripListSortPrice,
            selected: sort == _Sort.priceAsc,
            onTap: () => onSort(_Sort.priceAsc),
          ),
          const Spacer(),
          _chip(
            label: l10n.tripListVerifiedOnly,
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
  final bool isSelected;
  final VoidCallback onTap;

  const _TripCard({
    required this.trip,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final time =
        '${trip.departureTime.hour.toString().padLeft(2, '0')}:${trip.departureTime.minute.toString().padLeft(2, '0')}';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.teal : AppTheme.slate200,
            width: isSelected ? 2.0 : 1.0,
          ),
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
                if (isSelected) ...[
                  const Spacer(),
                  Text(
                    'Detallara baxmaq üçün yenidən toxunun',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.tealDark,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Icon(Icons.chevron_right,
                      size: 16, color: AppTheme.tealDark),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
