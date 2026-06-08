import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/loading_view.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../../../shared/widgets/price_text.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/user_avatar.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../bookings/data/bookings_repository.dart';
import '../../data/rides_repository.dart';

class RideDetailsScreen extends ConsumerStatefulWidget {
  const RideDetailsScreen({
    required this.rideId,
    super.key,
  });

  final String rideId;

  @override
  ConsumerState<RideDetailsScreen> createState() => _RideDetailsScreenState();
}

class _RideDetailsScreenState extends ConsumerState<RideDetailsScreen> {
  bool _isBooking = false;

  Future<void> _handleBooking() async {
    final l10n = AppLocalizations.of(context);
    final authState = ref.read(authControllerProvider);

    if (!authState.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${l10n.login} required before booking.')),
      );
      unawaited(context.push('/auth/login'));
      return;
    }

    setState(() => _isBooking = true);
    final result = await ref.read(bookingsRepositoryProvider).createBooking(
      rideId: widget.rideId,
      seats: 1,
    );

    if (!mounted) {
      return;
    }

    setState(() => _isBooking = false);

    switch (result) {
      case ApiSuccess():
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking request sent.')),
        );
        context.go('/bookings');
        return;
      case ApiFailure(:final message):
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final future = ref.watch(_rideProvider(widget.rideId));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.rideDetails)),
      body: future.when(
        data: (ride) {
          if (ride == null) {
            return const EmptyState(
              title: 'Ride not found',
              subtitle: 'This ride may no longer be active.',
              icon: Icons.route_outlined,
            );
          }

          return ListView(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            children: <Widget>[
              AppSectionTitle(
                '${ride.fromCity} -> ${ride.toCity}',
                subtitle: formatDeparture(ride.departureTime),
              ),
              const SizedBox(height: 12),
              AppCard(
                child: Row(
                  children: <Widget>[
                    UserAvatar(user: ride.driver, radius: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            ride.driver.fullName,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Driver rating ${ride.driver.rating.toStringAsFixed(1)} - ${ride.driver.completedTrips} completed trips',
                          ),
                        ],
                      ),
                    ),
                    StatusBadge(label: ride.status.name),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Route', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 10),
                    Text('Meeting point: ${ride.meetingPoint}'),
                    const SizedBox(height: 6),
                    Text('Dropoff: ${ride.dropoffPoint}'),
                    const SizedBox(height: 14),
                    Text('Departure', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 10),
                    Text(formatDeparture(ride.departureTime)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Price and seats',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    PriceText(ride.priceAzn),
                    const SizedBox(height: 6),
                    Text('Seats: ${ride.availableSeats}/${ride.totalSeats}'),
                    if (ride.description.isNotEmpty) ...<Widget>[
                      const SizedBox(height: 14),
                      Text(
                        'Notes',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(ride.description),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AppButton(
                label: ride.availableSeats > 0 ? l10n.bookNow : 'No seats left',
                isLoading: _isBooking,
                onPressed: ride.availableSeats > 0 && !_isBooking
                    ? _handleBooking
                    : null,
              ),
            ],
          );
        },
        error: (_, _) => ErrorView(
          title: 'Unable to load ride',
          message: l10n.commonError,
          onRetry: () => ref.invalidate(_rideProvider(widget.rideId)),
        ),
        loading: () => const LoadingView(label: 'Loading ride details...'),
      ),
    );
  }
}

final _rideProvider = FutureProvider.family.autoDispose((ref, String rideId) {
  return ref.watch(ridesRepositoryProvider).getRideById(rideId);
});
