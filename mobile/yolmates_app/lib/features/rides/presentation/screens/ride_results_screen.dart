import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/models/ride.dart';
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
    final future = ref.watch(
      _rideResultsProvider(
        RideSearchFilters(
          fromCity: fromCity,
          toCity: toCity,
          seats: seats,
          date: date,
        ),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.results)),
      body: future.when(
        data: (List<Ride> rides) {
          if (rides.isEmpty) {
            return EmptyState(title: l10n.emptyState);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            itemBuilder: (BuildContext context, int index) =>
                RideCard(ride: rides[index]),
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemCount: rides.length,
          );
        },
        error: (_, _) => EmptyState(title: l10n.commonError),
        loading: () => const LoadingView(),
      ),
    );
  }
}

final _rideResultsProvider = FutureProvider.family.autoDispose((
  ref,
  RideSearchFilters filters,
) {
  return ref.watch(ridesRepositoryProvider).searchRides(filters);
});
