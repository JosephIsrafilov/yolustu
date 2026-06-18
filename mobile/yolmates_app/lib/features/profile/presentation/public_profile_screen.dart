import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants.dart';
import '../../../core/network/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/models/user.dart';
import '../../reviews/data/reviews_repository.dart';

class PublicProfileScreen extends ConsumerWidget {
  final String userId;
  final User? initialUser;

  const PublicProfileScreen({
    required this.userId,
    this.initialUser,
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(
      publicProfileProvider((userId: userId, initialUser: initialUser)),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.spacing24),
            child: Text(
              'Profile could not be loaded.\n$error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.slate500),
            ),
          ),
        ),
        data: (profile) {
          final topReviews = profile.reviews.take(3).toList();
          return ListView(
            padding: const EdgeInsets.all(AppConstants.spacing16),
            children: [
              _Header(profile: profile),
              const SizedBox(height: 16),
              _InfoCard(
                children: [
                  _InfoRow(
                    icon: Icons.star_rounded,
                    label: 'Rating',
                    value: profile.user.rating.toStringAsFixed(1),
                  ),
                  _InfoRow(
                    icon: Icons.route_outlined,
                    label: 'Trips',
                    value: '${profile.user.tripCount}',
                  ),
                  if (profile.city != null && profile.city!.trim().isNotEmpty)
                    _InfoRow(
                      icon: Icons.location_on_outlined,
                      label: 'City',
                      value: profile.city!,
                    ),
                  _InfoRow(
                    icon: Icons.verified_user_outlined,
                    label: 'Status',
                    value: profile.user.isVerified ? 'Verified driver' : 'User',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _InfoCard(
                title: 'About',
                children: [
                  Text(
                    (profile.bio == null || profile.bio!.trim().isEmpty)
                        ? 'This user has not added any extra info yet.'
                        : profile.bio!,
                    style: const TextStyle(
                      color: AppTheme.navy,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
              if (topReviews.isNotEmpty) ...[
                const SizedBox(height: 16),
                _InfoCard(
                  title: 'Reviews',
                  children: [
                    for (var i = 0; i < topReviews.length; i++) ...[
                      _ReviewRow(review: topReviews[i]),
                      if (i < topReviews.length - 1)
                        const Divider(height: 24, color: AppTheme.slate100),
                    ],
                  ],
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

typedef _ProfileArgs = ({String userId, User? initialUser});

final publicProfileProvider =
    FutureProvider.autoDispose.family<_PublicProfileVm, _ProfileArgs>(
  (ref, args) async {
    final client = ref.read(apiClientProvider);
    final reviewsRepo = ref.read(reviewsRepositoryProvider);

    User baseUser = args.initialUser ??
        const User(
          id: '',
          name: 'User',
          phone: '',
          rating: 0,
          tripCount: 0,
        );
    String? bio;
    String? city;

    try {
      final response = await client.get('/users/${args.userId}');
      final data = response.data as Map<String, dynamic>;
      final fullName =
          '${data['first_name'] ?? ''} ${data['last_name'] ?? ''}'.trim();
      baseUser = User(
        id: data['id'].toString(),
        name: fullName.isEmpty ? baseUser.name : fullName,
        phone: data['phone'] as String? ?? baseUser.phone,
        avatarUrl: data['avatar_url'] as String? ?? baseUser.avatarUrl,
        rating: (data['rating'] as num?)?.toDouble() ?? baseUser.rating,
        tripCount: (data['total_rides'] as num?)?.toInt() ?? baseUser.tripCount,
        isVerified: data['is_verified'] as bool? ?? baseUser.isVerified,
      );
      bio = data['bio'] as String?;
      city = data['city'] as String?;
    } catch (_) {
      if (args.initialUser == null) rethrow;
    }

    List<Review> reviews = const [];
    try {
      reviews = await reviewsRepo.getReviews(args.userId);
    } catch (_) {}

    return _PublicProfileVm(
      user: baseUser,
      bio: bio,
      city: city,
      reviews: reviews,
    );
  },
);

class _PublicProfileVm {
  final User user;
  final String? bio;
  final String? city;
  final List<Review> reviews;

  const _PublicProfileVm({
    required this.user,
    this.bio,
    this.city,
    this.reviews = const [],
  });
}

class _Header extends StatelessWidget {
  final _PublicProfileVm profile;

  const _Header({required this.profile});

  @override
  Widget build(BuildContext context) {
    final avatarUrl = profile.user.avatarUrl;
    final hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;
    final avatarImage = hasAvatar
        ? (avatarUrl.startsWith('http')
            ? NetworkImage(avatarUrl) as ImageProvider
            : FileImage(File(avatarUrl)))
        : null;

    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing24),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: AppTheme.teal.withValues(alpha: 0.22),
            backgroundImage: avatarImage,
            child: hasAvatar
                ? null
                : Text(
                    profile.user.name.isNotEmpty
                        ? profile.user.name[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.user.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      profile.user.isVerified
                          ? Icons.verified
                          : Icons.person_outline,
                      size: 16,
                      color: AppTheme.tealLight,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      profile.user.isVerified ? 'Verified driver' : 'User',
                      style: const TextStyle(
                        color: AppTheme.tealLight,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String? title;
  final List<Widget> children;

  const _InfoCard({this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.navy,
              ),
            ),
            const SizedBox(height: 12),
          ],
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.slate500),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(color: AppTheme.slate500)),
          const Spacer(),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(
                color: AppTheme.navy,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final Review review;

  const _ReviewRow({required this.review});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                review.authorName,
                style: const TextStyle(
                  color: AppTheme.navy,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Icon(Icons.star_rounded, color: Colors.amber.shade600, size: 16),
            const SizedBox(width: 4),
            Text('${review.rating}'),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          review.comment.isEmpty ? 'No text review added.' : review.comment,
          style: const TextStyle(color: AppTheme.slate700, height: 1.4),
        ),
      ],
    );
  }
}
