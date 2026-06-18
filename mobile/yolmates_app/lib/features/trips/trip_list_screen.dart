import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/repositories/rides_repository.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/models/trip.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/skeleton_cards.dart';

class TripListScreen extends ConsumerStatefulWidget {
  final String fromCity;
  final String toCity;
  final int passengers;
  final DateTime? date;
  final DateTime? dateTo;

  const TripListScreen({
    required this.fromCity,
    required this.toCity,
    this.passengers = 1,
    this.date,
    this.dateTo,
    super.key,
  });

  @override
  ConsumerState<TripListScreen> createState() => _TripListScreenState();
}

enum _Sort { timeAsc, priceAsc }

class _TripListScreenState extends ConsumerState<TripListScreen> {
  _Sort _sort = _Sort.timeAsc;
  bool _verifiedOnly = false;
  bool _womenOnly = false;
  bool _noSmoking = false;
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
      date: widget.date,
      dateTo: widget.dateTo,
      passengers: widget.passengers,
    );
    final ridesAsync = ref.watch(rideSearchProvider(params));
    final dateLabel = widget.dateTo != null
        ? ' · ${l10n.dateThisWeek}'
        : widget.date != null
            ? ' · ${widget.date!.day}.${widget.date!.month}.${widget.date!.year}'
            : '';

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.fromCity} → ${widget.toCity}$dateLabel'),
      ),
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
    final now = DateTime.now();
    var filtered = rides.where((r) => r.departureTime.isAfter(now)).toList();
    if (_verifiedOnly) {
      filtered = filtered.where((r) => r.driver.isVerified || r.driver.rating >= 4.7).toList();
    }
    if (_womenOnly) {
      filtered = filtered.where((r) => r.femaleOnly).toList();
    }
    if (_noSmoking) {
      filtered = filtered.where((r) => !r.allowSmoking).toList();
    }

    switch (_sort) {
      case _Sort.timeAsc:
        filtered.sort((a, b) => a.departureTime.compareTo(b.departureTime));
      case _Sort.priceAsc:
        filtered.sort((a, b) => a.price.compareTo(b.price));
    }

    final activeIndex =
        _selectedIndex.clamp(0, filtered.isEmpty ? 0 : filtered.length - 1);

    return Column(
      children: [
        _FilterBar(
          sort: _sort,
          verifiedOnly: _verifiedOnly,
          womenOnly: _womenOnly,
          noSmoking: _noSmoking,
          onSort: (s) => setState(() => _sort = s),
          onVerified: (v) => setState(() => _verifiedOnly = v),
          onWomenOnly: (v) => setState(() => _womenOnly = v),
          onNoSmoking: (v) => setState(() => _noSmoking = v),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _refresh(
              RideSearchParams(
                fromCity: widget.fromCity,
                toCity: widget.toCity,
                date: widget.date,
                dateTo: widget.dateTo,
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
                    itemCount: filtered.length + (filtered.length < 3 ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      if (i == filtered.length) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text(
                            'Bu parametrlərlə başqa gediş yoxdur, tarixləri dəyişməyi yoxlayın.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppTheme.slate500),
                          ),
                        );
                      }

                      final isSelected = i == activeIndex;
                      return _TripCard(
                        trip: filtered[i],
                        isSelected: isSelected,
                        showDate: widget.date == null || widget.dateTo != null,
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
  final bool womenOnly;
  final bool noSmoking;
  final ValueChanged<_Sort> onSort;
  final ValueChanged<bool> onVerified;
  final ValueChanged<bool> onWomenOnly;
  final ValueChanged<bool> onNoSmoking;

  const _FilterBar({
    required this.sort,
    required this.verifiedOnly,
    required this.womenOnly,
    required this.noSmoking,
    required this.onSort,
    required this.onVerified,
    required this.onWomenOnly,
    required this.onNoSmoking,
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
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
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
            const SizedBox(width: 8),
            _chip(
              label: l10n.tripListVerifiedOnly,
              icon: Icons.verified,
              selected: verifiedOnly,
              onTap: () => onVerified(!verifiedOnly),
            ),
            const SizedBox(width: 8),
            _chip(
              label: 'Yalnız qadınlar',
              icon: Icons.female,
              selected: womenOnly,
              onTap: () => onWomenOnly(!womenOnly),
            ),
            const SizedBox(width: 8),
            _chip(
              label: 'Siqaret çəkilmir',
              icon: Icons.smoke_free,
              selected: noSmoking,
              onTap: () => onNoSmoking(!noSmoking),
            ),
          ],
        ),
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
              Icon(
                icon,
                size: 14,
                color: selected ? AppTheme.tealDark : AppTheme.slate500,
              ),
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

class _TripCard extends ConsumerWidget {
  final Trip trip;
  final bool isSelected;
  final bool showDate;
  final VoidCallback onTap;

  const _TripCard({
    required this.trip,
    required this.isSelected,
    required this.showDate,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final timeStr =
        '${trip.departureTime.hour.toString().padLeft(2, '0')}:${trip.departureTime.minute.toString().padLeft(2, '0')}';
    
    final dateStr = showDate 
        ? '${trip.departureTime.day.toString().padLeft(2, '0')}.${trip.departureTime.month.toString().padLeft(2, '0')} · '
        : '';
    final displayTime = '$dateStr$timeStr';

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
                Stack(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                      child: trip.driver.avatarUrl != null
                          ? null // TODO: handle image network
                          : Text(
                              trip.driver.name[0],
                              style: const TextStyle(
                                color: AppTheme.tealDark,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                    if (trip.driver.isVerified)
                      Positioned(
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.verified,
                            color: AppTheme.teal,
                            size: 14,
                          ),
                        ),
                      ),
                  ],
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
                            '${trip.driver.rating.toStringAsFixed(1)} · ${trip.driver.tripCount} ${l10n.tripsPlural(trip.driver.tripCount)}',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.slate500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${trip.fromCity} → ${trip.toCity}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.navy,
                        ),
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
            Wrap(
              spacing: 18,
              runSpacing: 10,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.access_time, size: 18),
                    const SizedBox(width: 8),
                    Text(displayTime, style: const TextStyle(fontSize: 15)),
                  ],
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.event_seat, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      '${trip.availableSeats} ${l10n.commonAvailableSeats}',
                      style: const TextStyle(fontSize: 15),
                    ),
                  ],
                ),
                if (isSelected)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Detallara baxmaq üçün yenidən toxunun',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppTheme.tealDark,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(
                        Icons.chevron_right,
                        size: 16,
                        color: AppTheme.tealDark,
                      ),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
