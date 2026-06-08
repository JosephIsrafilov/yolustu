import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../shared/models/booking.dart';
import '../../../../shared/widgets/price_text.dart';
import '../../../../shared\widgets/status_badge.dart';
import '../../data/bookings_repository.dart';

class BookingDetailsScreen extends ConsumerStatefulWidget {
  const BookingDetailsScreen({
    required this.bookingId,
    this.initialBooking,
    super.key,
  });

  final String bookingId;
  final Booking? initialBooking;

  @override
  ConsumerState<BookingDetailsScreen> createState() =>
      _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends ConsumerState<BookingDetailsScreen> {
  bool _isCancelling = false;

  Future<void> _cancelBooking() async {
    setState(() => _isCancelling = true);
    final result = await ref
        .read(bookingsRepositoryProvider)
        .cancelBooking(widget.bookingId);

    if (!mounted) {
      return;
    }

    setState(() => _isCancelling = false);

    switch (result) {
      case ApiSuccess():
        ref.invalidate(myBookingsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Booking cancelled.')),
        );
        Navigator.of(context).pop();
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
    final booking = widget.initialBooking;
    if (booking == null) {
      return const Scaffold(
        body: SafeArea(
          child: EmptyState(title: 'Booking details are unavailable.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Booking details')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.screenPadding),
        children: <Widget>[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  '${booking.ride.fromCity} -> ${booking.ride.toCity}',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(formatDeparture(booking.ride.departureTime)),
                const SizedBox(height: 12),
                Row(
                  children: <Widget>[
                    const Text('Status'),
                    const SizedBox(width: 8),
                    StatusBadge(label: booking.status.name),
                  ],
                ),
                const SizedBox(height: 12),
                Text('Seats: ${booking.seats}'),
                const SizedBox(height: 8),
                PriceText(booking.totalPrice),
                const SizedBox(height: 8),
                Text('Driver: ${booking.ride.driver.fullName}'),
                const SizedBox(height: 8),
                Text('Meeting point: ${booking.ride.meetingPoint}'),
                const SizedBox(height: 8),
                Text('Dropoff: ${booking.ride.dropoffPoint}'),
                if (booking.ride.description.isNotEmpty) ...<Widget>[
                  const SizedBox(height: 12),
                  Text(booking.ride.description),
                ],
              ],
            ),
          ),
          if (booking.canCancel) ...<Widget>[
            const SizedBox(height: 16),
            AppButton(
              label: 'Cancel booking',
              isSecondary: true,
              isLoading: _isCancelling,
              onPressed: _isCancelling ? null : _cancelBooking,
            ),
          ],
        ],
      ),
    );
  }
}
