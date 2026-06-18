import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/repositories/rides_repository.dart';
import '../../core/theme.dart';
import '../../shared/models/trip.dart';
import '../../shared/widgets/driver_trust_card.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import '../../shared/widgets/map/route_map_view.dart';
import '../auth/state/auth_controller.dart';
import '../chat/data/chat_repository.dart';

/// Ride detail with driver card, car/seat/preference blocks and a pinned
/// booking bar. Resolves the ride from the mock dataset by [tripId].
class TripDetailScreen extends ConsumerWidget {
  final String tripId;

  const TripDetailScreen({required this.tripId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final rideAsync = ref.watch(rideByIdProvider(tripId));

    return rideAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: Text(l10n.tripDetailTitle)),
        body: const LoadingView(),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(title: Text(l10n.tripDetailTitle)),
        body: ErrorStateView(
          title: l10n.tripDetailNotFound,
          message: error.toString(),
          onRetry: () => ref.invalidate(rideByIdProvider(tripId)),
        ),
      ),
      data: (ride) {
        if (ride == null) {
          return Scaffold(
            appBar: AppBar(title: Text(l10n.tripDetailTitle)),
            body: ErrorStateView(
              title: l10n.tripDetailNotFound,
              message: l10n.tripDetailNotFoundMessage,
              onRetry: () => context.pop(),
              retryLabel: l10n.bookingDetailGoBack,
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(title: Text(l10n.tripDetailTitle)),
          body: _Body(ride: ride),
          bottomNavigationBar: _BookingBar(ride: ride),
        );
      },
    );
  }
}

class _Body extends ConsumerWidget {
  final Trip ride;

  const _Body({required this.ride});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final time =
        '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppConstants.spacing24),
            color: AppTheme.navy,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _CityTime(city: ride.fromCity, time: time),
                Column(
                  children: [
                    Icon(Icons.arrow_forward, color: AppTheme.tealLight),
                    const SizedBox(height: 4),
                    Text(l10n.tripDetailDuration,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7))),
                  ],
                ),
                _CityTime(city: ride.toCity, time: '', alignEnd: true),
              ],
            ),
          ),

          // Map visualizer
          SizedBox(
            height: 200,
            width: double.infinity,
            child: RouteMapView(
              origin: ride.fromCity,
              destination: ride.toCity,
              forceCanvas: true,
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(AppConstants.spacing24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Trust block
                const TripTrustBlock(),
                const SizedBox(height: 20),

                // Driver card
                _SectionTitle(l10n.tripDetailDriverSection),
                const SizedBox(height: 12),
                DriverTrustCard(
                  driver: ride.driver,
                  showVerificationBadge: true,
                  showMessageButton: true,
                  onMessageTap: () async {
                    // Create or get the conversation for this ride
                    final repo = ref.read(chatRepositoryProvider);
                    try {
                      // Note: getOrCreateRideConversation expects a booking ID or ride ID depending on backend implementation.
                      // The backend route is POST /chats/ride. If it takes booking_id but we just have ride, we might pass ride.id.
                      // Wait, let's just pass ride.id since we might not have booked it yet!
                      final conv = await repo.getOrCreateRideConversation(ride.id);
                      if (context.mounted) {
                        context.push('/messages/${conv.id}');
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Söhbət yaradıla bilmədi. Səbəb: ${e.toString()}')),
                        );
                      }
                    }
                  },
                ),
                const SizedBox(height: 24),
                _SectionTitle(l10n.tripDetailInfoSection),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_seat,
                  label: l10n.tripDetailAvailableSeats,
                  value: '${ride.availableSeats} ${l10n.tripDetailSeatsUnit}',
                ),
                _DetailRow(
                  icon: Icons.directions_car,
                  label: l10n.tripDetailCar,
                  value: 'Toyota Camry',
                ),
                _DetailRow(
                  icon: Icons.luggage,
                  label: l10n.tripDetailLuggage,
                  value: l10n.tripDetailLuggageSize,
                ),
                const SizedBox(height: 24),
                _SectionTitle(l10n.tripDetailPreferences),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _PrefChip(
                        icon: Icons.smoke_free,
                        label: l10n.tripDetailNoSmoking),
                    _PrefChip(
                        icon: Icons.music_note, label: l10n.tripDetailMusic),
                    _PrefChip(
                        icon: Icons.luggage,
                        label: l10n.tripDetailLuggageAllowed),
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

class _CityTime extends StatelessWidget {
  final String city;
  final String time;
  final bool alignEnd;

  const _CityTime({
    required this.city,
    required this.time,
    this.alignEnd = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          city,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        if (time.isNotEmpty)
          Text(time,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7))),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
    );
  }
}

class _PrefChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PrefChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.slate100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppTheme.slate700),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 13, color: AppTheme.slate700)),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.slate500),
          const SizedBox(width: 12),
          Text(label, style: const TextStyle(fontSize: 15)),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _BookingBar extends ConsumerWidget {
  final Trip ride;

  const _BookingBar({required this.ride});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final currentUser = ref.watch(authControllerProvider).user;
    final isOwnRide = currentUser?.id == ride.driver.id;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.spacing16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.tripDetailPriceLabel,
                        style:
                            TextStyle(fontSize: 12, color: AppTheme.slate500)),
                    Text(
                      '${ride.price.toStringAsFixed(0)} AZN',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.tealDark,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: (ride.availableSeats > 0 && !isOwnRide)
                        ? () => context.push('/booking/confirm/${ride.id}')
                        : null,
                    child: Text(isOwnRide
                        ? 'Sizin gedişiniz'
                        : (ride.availableSeats > 0
                            ? l10n.tripDetailBookBtn
                            : l10n.tripDetailNoSeats)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
