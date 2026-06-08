import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
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
    final future = ref.watch(myBookingsProvider);

    return future.when(
      data: (bookings) {
        if (bookings.isEmpty) {
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myBookingsProvider),
            child: ListView(
              padding: const EdgeInsets.all(AppConstants.screenPadding),
              children: <Widget>[
                EmptyState(title: l10n.emptyState),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(myBookingsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            itemBuilder: (BuildContext context, int index) {
              final booking = bookings[index];
              return AppCard(
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => context.push('/bookings/${booking.id}', extra: booking),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        '${booking.ride.fromCity} -> ${booking.ride.toCity}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(formatDeparture(booking.ride.departureTime)),
                      const SizedBox(height: 8),
                      Row(
                        children: <Widget>[
                          StatusBadge(label: booking.status.name),
                          const SizedBox(width: 10),
                          Text('Seats: ${booking.seats}'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: <Widget>[
                          Expanded(
                            child: Text(
                              'Driver: ${booking.ride.driver.fullName}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 12),
                          PriceText(booking.totalPrice),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemCount: bookings.length,
          ),
        );
      },
      error: (_, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              EmptyState(title: l10n.commonError),
              const SizedBox(height: 12),
              AppButton(
                label: 'Retry',
                isSecondary: true,
                onPressed: () => ref.invalidate(myBookingsProvider),
              ),
            ],
          ),
        ),
      ),
      loading: () => const LoadingView(),
    );
  }
}
