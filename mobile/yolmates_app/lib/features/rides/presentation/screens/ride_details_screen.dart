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
import '../../../../core/widgets/loading_view.dart';
import '../../../auth/presentation/auth_controller.dart';
import '../../../bookings/data/bookings_repository.dart';
import '../../../../shared/widgets/price_text.dart';
import '../../../../shared/widgets/status_badge.dart';
import '../../../../shared/widgets/user_avatar.dart';
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
    final context = this.context;
    final l10n = AppLocalizations.of(context);
    final authState = ref.read(authControllerProvider);

    if (!authState.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${l10n.login} required before booking.')),
      );
      context.push('/auth/login');
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
            return EmptyState(title: l10n.emptyState);
          }
          return ListView(
            padding: const EdgeInsets.all(AppConstants.screenPadding),
            children: <Widget>[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        UserAvatar(user: ride.driver),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${ride.fromCity} -> ${ride.toCity}',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        StatusBadge(label: ride.status.name),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(formatDeparture(ride.departureTime)),
                    const SizedBox(height: 12),
                    Text(
                      'Driver: ${ride.driver.fullName} • ${ride.driver.rating.toStringAsFixed(1)}',
                    ),
                    const SizedBox(height: 12),
                    Text('Meeting point: ${ride.meetingPoint}'),
                    Text('Dropoff: ${ride.dropoffPoint}'),
                    const SizedBox(height: 12),
                    PriceText(ride.priceAzn),
                    Text('Seats: ${ride.availableSeats}/${ride.totalSeats}'),
                    const SizedBox(height: 12),
                    Text(ride.description),
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
        error: (_, _) => EmptyState(title: l10n.commonError),
        loading: () => const LoadingView(),
      ),
    );
  }
}

final _rideProvider = FutureProvider.family.autoDispose((ref, String rideId) {
  return ref.watch(ridesRepositoryProvider).getRideById(rideId);
});
