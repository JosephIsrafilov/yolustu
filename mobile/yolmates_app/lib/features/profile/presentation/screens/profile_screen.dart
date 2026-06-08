import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/mock/mock_data.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/user_avatar.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../reviews/data/reviews_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final reviews = ref.watch(_reviewsProvider);
    final user = authState.user ?? mockCurrentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.screenPadding),
        children: <Widget>[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    UserAvatar(user: user, radius: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        user.fullName,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    StatusBadge(label: user.verificationStatus.name),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Rating: ${user.rating.toStringAsFixed(1)}'),
                Text('Trips: ${user.completedTrips}'),
                if (authState.user == null) ...<Widget>[
                  const SizedBox(height: 10),
                  const Text(
                    'Signed-in profile data is unavailable, so the local demo profile is shown.',
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          reviews.when(
            data: (items) => items.isEmpty
                ? const EmptyState(
                    title: 'No reviews yet',
                    subtitle: 'Completed rides and new passengers will show feedback here.',
                    icon: Icons.reviews_outlined,
                  )
                : AppCard(child: Text('Reviews: ${items.length}')),
            error: (_, _) => const AppCard(child: Text('Reviews unavailable')),
            loading: () => const AppCard(
              child: LoadingView(compact: true, label: 'Loading reviews...'),
            ),
          ),
        ],
      ),
    );
  }
}

final _reviewsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(reviewsRepositoryProvider).getReviews();
});
