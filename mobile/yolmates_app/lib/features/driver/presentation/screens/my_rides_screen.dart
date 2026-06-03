import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../rides/data/rides_repository.dart';
import '../../../rides/presentation/widgets/ride_card.dart';

class MyRidesScreen extends ConsumerWidget {
  const MyRidesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final future = ref.watch(_myRidesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My rides')),
      body: future.when(
        data: (rides) {
          if (rides.isEmpty) {
            return const EmptyState(title: 'No rides created yet.');
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            itemBuilder: (_, int index) => RideCard(ride: rides[index]),
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemCount: rides.length,
          );
        },
        error: (_, _) => const EmptyState(title: 'Unable to load rides.'),
        loading: () => const LoadingView(),
      ),
    );
  }
}

final _myRidesProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(ridesRepositoryProvider).getDriverRides();
});
