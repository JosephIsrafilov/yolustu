import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/models/ride.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../../../shared/widgets/yolmates_logo.dart';
import '../../data/rides_repository.dart';
import '../../domain/ride_search_filters.dart';
import '../widgets/ride_card.dart';

class RideResultsScreen extends ConsumerWidget {
  const RideResultsScreen({
    this.fromCity,
    this.toCity,
    this.seats,
    this.date,
    super.key,
  });

  final String? fromCity;
  final String? toCity;
  final int? seats;
  final DateTime? date;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final filters = RideSearchFilters(
      fromCity: fromCity,
      toCity: toCity,
      seats: seats,
      date: date,
    );
    final future = ref.watch(_rideResultsProvider(filters));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.results)),
      body: future.when(
        data: (List<Ride> rides) {
          if (rides.isEmpty) {
            return const Padding(
              padding: EdgeInsets.all(AppConstants.screenPadding),
              child: EmptyState(
                title: 'No rides found',
                subtitle:
                    'Try another city pair, a later date, or fewer seats.',
                icon: Icons.route_outlined,
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            children: <Widget>[
              const YolmatesLogo(
                title: 'Yolmates',
                subtitle: 'Live ride results',
                compact: true,
              ),
              const SizedBox(height: 16),
              AppSectionTitle(
                '${rides.length} rides found',
                subtitle: _buildFilterSummary(filters),
              ),
              const SizedBox(height: 12),
              ...rides.map(
                (ride) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: RideCard(ride: ride),
                ),
              ),
            ],
          );
        },
        error: (_, _) => Padding(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          child: ErrorView(
            title: 'Unable to load rides',
            message: l10n.commonError,
            onRetry: () => ref.invalidate(_rideResultsProvider(filters)),
          ),
        ),
        loading: () =>
            const LoadingView(label: 'Loading available rides...'),
      ),
    );
  }

  String _buildFilterSummary(RideSearchFilters filters) {
    final parts = <String>[];
    if ((filters.fromCity ?? '').isNotEmpty) {
      parts.add(filters.fromCity!);
    }
    if ((filters.toCity ?? '').isNotEmpty) {
      parts.add(filters.toCity!);
    }
    if (filters.seats != null) {
      parts.add('${filters.seats} seat${filters.seats == 1 ? '' : 's'}');
    }
    if (filters.date != null) {
      final value = filters.date!;
      parts.add(
        '${value.day.toString().padLeft(2, '0')}.${value.month.toString().padLeft(2, '0')}.${value.year}',
      );
    }
    return parts.isEmpty
        ? 'Browse active rides from the current backend feed.'
        : parts.join(' - ');
  }
}

final _rideResultsProvider = FutureProvider.family.autoDispose((
  ref,
  RideSearchFilters filters,
) {
  return ref.watch(ridesRepositoryProvider).searchRides(filters);
});
