import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/models/user.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import '../../shared/widgets/status_badge.dart';
import '../chat/data/chat_repository.dart';
import 'data/booking.dart';
import 'data/bookings_controller.dart';

/// Reservations tab.
///
/// Reactive list from [bookingsControllerProvider]; shows shared
/// loading/error/empty states and routes each card to its detail screen.
class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final bookingsAsync = ref.watch(bookingsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.bookingsTitle)),
      body: bookingsAsync.when(
        loading: () => LoadingView(message: l10n.bookingsLoading),
        error: (e, _) => ErrorStateView(
          title: l10n.bookingsLoadFailed,
          message: e.toString(),
          onRetry: () =>
              ref.read(bookingsControllerProvider.notifier).refresh(),
        ),
        data: (bookings) {
          if (bookings.isEmpty) {
            return EmptyState(
              icon: Icons.confirmation_number_outlined,
              title: l10n.bookingsEmpty,
              message: l10n.bookingsEmptyMessage,
              actionLabel: l10n.bookingsSearchTrips,
              onAction: () => context.go(AppRoutes.search),
            );
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(bookingsControllerProvider.notifier).refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              itemCount: bookings.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _BookingCard(booking: bookings[i]),
            ),
          );
        },
      ),
    );
  }
}

class _BookingCard extends ConsumerWidget {
  final Booking booking;

  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final time =
        '${booking.departureTime.hour.toString().padLeft(2, '0')}:${booking.departureTime.minute.toString().padLeft(2, '0')}';
    final date =
        '${booking.departureTime.day}.${booking.departureTime.month}.${booking.departureTime.year}';

    return InkWell(
      onTap: () => context.push('${AppRoutes.bookings}/${booking.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.slate200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${booking.fromCity} → ${booking.toCity}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                StatusBadge(
                  label: booking.status.label,
                  backgroundColor: booking.status.colors.$1,
                  foregroundColor: booking.status.colors.$2,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16),
                const SizedBox(width: 6),
                Text(date),
                const SizedBox(width: 16),
                const Icon(Icons.access_time, size: 16),
                const SizedBox(width: 6),
                Text(time),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.person, size: 16, color: AppTheme.slate500),
                const SizedBox(width: 6),
                Text(
                  booking.driverName,
                  style: TextStyle(color: AppTheme.slate500),
                ),
                const Spacer(),
                Text(
                  '${booking.total.toStringAsFixed(0)} AZN',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.tealDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        final conversation = await ref
                            .read(chatRepositoryProvider)
                            .getOrCreateRideConversation(booking.rideId);
                        if (context.mounted) {
                          context.push(
                            '${AppRoutes.messages}/${conversation.id}',
                          );
                        }
                      } catch (error) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Çat açıla bilmədi: $error'),
                            ),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.message_outlined),
                    label: const Text('Chat'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final profileUser = User(
                        id: booking.driverId,
                        name: booking.driverName,
                        phone: '',
                        rating: 0,
                        tripCount: 0,
                      );
                      context.push(
                        '${AppRoutes.publicProfile}/${booking.driverId}',
                        extra: profileUser,
                      );
                    },
                    icon: const Icon(Icons.person_outline),
                    label: const Text('Profile'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
