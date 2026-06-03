import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../data/driver_repository.dart';

class DriverDashboardScreen extends ConsumerWidget {
  const DriverDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final future = ref.watch(_driverDashboardProvider);

    return future.when(
      data: (dashboard) => ListView(
        padding: const EdgeInsets.all(AppConstants.screenPadding),
        children: <Widget>[
          Text(l10n.driverPanel, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Active rides: ${dashboard.activeRides}'),
                const SizedBox(height: 8),
                Text('Pending requests: ${dashboard.pendingRequests}'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppButton(
            label: l10n.createRide,
            onPressed: () => context.push('/driver/create-ride'),
            icon: Icons.add_road,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'My rides',
            isSecondary: true,
            onPressed: () => context.push('/driver/my-rides'),
          ),
        ],
      ),
      error: (_, _) =>
          const Center(child: Text('Unable to load driver dashboard')),
      loading: () => const LoadingView(),
    );
  }
}

final _driverDashboardProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(driverRepositoryProvider).getDashboard();
});
