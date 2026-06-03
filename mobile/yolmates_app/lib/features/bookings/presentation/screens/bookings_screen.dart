import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/widgets/price_text.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../data/bookings_repository.dart';

class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final future = ref.watch(_bookingsProvider);

    return future.when(
      data: (bookings) {
        if (bookings.isEmpty) {
          return EmptyState(title: l10n.emptyState);
        }
        return ListView.separated(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          itemBuilder: (BuildContext context, int index) {
            final booking = bookings[index];
            return AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    '${booking.ride.fromCity} → ${booking.ride.toCity}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: <Widget>[
                      StatusBadge(label: booking.status.name),
                      const SizedBox(width: 10),
                      Text('Seats: ${booking.seats}'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  PriceText(booking.ride.priceAzn),
                ],
              ),
            );
          },
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemCount: bookings.length,
        );
      },
      error: (_, _) => EmptyState(title: l10n.commonError),
      loading: () => const LoadingView(),
    );
  }
}

final _bookingsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(bookingsRepositoryProvider).getMyBookings();
});
