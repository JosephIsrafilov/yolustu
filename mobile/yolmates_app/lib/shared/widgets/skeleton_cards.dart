import 'package:flutter/material.dart';
import '../../core/constants.dart';
import 'shimmer.dart';

/// Booking card skeleton for loading state.
class BookingCardSkeleton extends StatelessWidget {
  const BookingCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Container(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(child: SkeletonBox(height: 20, width: 150)),
                const SizedBox(width: 12),
                SkeletonBox(height: 24, width: 80, borderRadius: 8),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const SkeletonBox(height: 16, width: 100),
                const SizedBox(width: 16),
                const SkeletonBox(height: 16, width: 60),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Expanded(child: SkeletonBox(height: 16, width: 120)),
                const SizedBox(width: 16),
                const SkeletonBox(height: 16, width: 50),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Trip card skeleton for search results.
class TripCardSkeleton extends StatelessWidget {
  const TripCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Container(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const SkeletonCircle(size: 40),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(height: 16, width: 100),
                      SizedBox(height: 4),
                      SkeletonBox(height: 14, width: 140),
                    ],
                  ),
                ),
                const SkeletonBox(height: 20, width: 60),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              children: [
                const SkeletonBox(height: 16, width: 80),
                const SizedBox(width: 24),
                const SkeletonBox(height: 16, width: 100),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Chat conversation skeleton.
class ChatCardSkeleton extends StatelessWidget {
  const ChatCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListTile(
        leading: const SkeletonCircle(size: 48),
        title: const SkeletonBox(height: 16, width: 120),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: const SkeletonBox(height: 14, width: 200),
        ),
        trailing: const SkeletonBox(height: 12, width: 40),
      ),
    );
  }
}

/// Notification item skeleton.
class NotificationCardSkeleton extends StatelessWidget {
  const NotificationCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Container(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const SkeletonCircle(size: 40),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(height: 16, width: double.infinity),
                  SizedBox(height: 6),
                  SkeletonBox(height: 14, width: 180),
                  SizedBox(height: 6),
                  SkeletonBox(height: 12, width: 80),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
