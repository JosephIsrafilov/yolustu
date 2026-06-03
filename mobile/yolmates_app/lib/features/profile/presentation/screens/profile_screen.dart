import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/mock/mock_data.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/user_avatar.dart';
import '../../../reviews/data/reviews_repository.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviews = ref.watch(_reviewsProvider);

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
                    const UserAvatar(user: mockCurrentUser, radius: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        mockCurrentUser.fullName,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    StatusBadge(label: mockCurrentUser.verificationStatus.name),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Rating: ${mockCurrentUser.rating.toStringAsFixed(1)}'),
                Text('Trips: ${mockCurrentUser.completedTrips}'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          reviews.when(
            data: (items) => AppCard(child: Text('Reviews: ${items.length}')),
            error: (_, _) => const AppCard(child: Text('Reviews unavailable')),
            loading: () => const AppCard(child: LoadingView()),
          ),
        ],
      ),
    );
  }
}

final _reviewsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(reviewsRepositoryProvider).getReviews();
});
