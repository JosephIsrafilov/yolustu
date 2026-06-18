import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/repositories/rides_repository.dart';
import '../../shared/models/trip.dart';
import '../wallet/data/wallet_controller.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import '../chat/data/chat_repository.dart';
import 'data/booking.dart';
import 'data/bookings_controller.dart';

/// Booking confirmation for a selected ride.
class BookingConfirmScreen extends ConsumerStatefulWidget {
  final String rideId;
  final int initialSeats;

  const BookingConfirmScreen({
    required this.rideId,
    this.initialSeats = 1,
    super.key,
  });

  @override
  ConsumerState<BookingConfirmScreen> createState() =>
      _BookingConfirmScreenState();
}

class _BookingConfirmScreenState extends ConsumerState<BookingConfirmScreen> {
  late int _seats = widget.initialSeats.clamp(1, 4);
  bool _submitting = false;
  String? _error;

  Future<void> _confirm(Trip ride) async {
    // Check wallet balance before booking
    const serviceFeePercent = 0.10;
    final total = ride.price * _seats * (1 + serviceFeePercent);
    final walletState = ref.read(walletControllerProvider).valueOrNull;
    if (walletState != null && walletState.balance.passengerBalance < total) {
      setState(() => _error =
          'Balansınız kifayət deyil. ${total.toStringAsFixed(2)} AZN lazımdır, lakin ${walletState.balance.passengerBalance.toStringAsFixed(2)} AZN var.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final booking = Booking(
        id: '',
        rideId: ride.id,
        fromCity: ride.fromCity,
        toCity: ride.toCity,
        driverName: ride.driver.name,
        departureTime: ride.departureTime,
        seats: _seats,
        pricePerSeat: ride.price,
        status: BookingStatus.pending,
        createdAt: DateTime.now(),
      );
      final created = await ref
          .read(bookingsControllerProvider.notifier)
          .createBooking(booking);
      if (!mounted) return;
      await _showSuccess();
      if (!mounted) return;

      // Navigate to chat and send automated message
      final chatRepo = ref.read(chatRepositoryProvider);
      final conversation =
          await chatRepo.getOrCreateRideConversation(created.rideId);

      final time =
          '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';
      final msg =
          'Sifariş detalı:\nMarşrut: ${ride.fromCity} - ${ride.toCity}\nVaxt: ${ride.departureTime.day.toString().padLeft(2, '0')}.${ride.departureTime.month.toString().padLeft(2, '0')} $time\nYer sayı: $_seats\nQiymət: ${ride.price.toStringAsFixed(0)} AZN/yer';
      await chatRepo.sendMessage(conversation.id, msg);

      if (!mounted) return;
      context.go('${AppRoutes.messages}/${conversation.id}');
    } catch (e) {
      if (!mounted) return;
      setState(() =>
          _error = 'Rezervasiya yaradıla bilmədi. Səbəb: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _showSuccess() {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.teal.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle,
                  color: AppTheme.tealDark, size: 40),
            ),
            const SizedBox(height: 16),
            const Text(
              'Rezervasiya göndərildi',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Sürücünün təsdiqini gözləyin.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.slate500),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Bağla'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rideAsync = ref.watch(rideByIdProvider(widget.rideId));

    return Scaffold(
      appBar: AppBar(title: const Text('Rezervasiyanı təsdiqlə')),
      body: rideAsync.when(
        loading: () => const LoadingView(message: 'Yüklənir...'),
        error: (_, __) => ErrorStateView(
          title: 'Səyahət tapılmadı',
          message: 'Bu səyahət artıq mövcud deyil.',
          onRetry: () => context.pop(),
          retryLabel: 'Geri qayıt',
        ),
        data: (ride) => ride == null
            ? ErrorStateView(
                title: 'Səyahət tapılmadı',
                message: 'Bu səyahət artıq mövcud deyil.',
                onRetry: () => context.pop(),
                retryLabel: 'Geri qayıt',
              )
            : _submitting
                ? const LoadingView(message: 'Rezervasiya yaradılır...')
                : _Content(
                    ride: ride,
                    seats: _seats,
                    error: _error,
                    onSeatsChanged: (s) => setState(() => _seats = s),
                    onConfirm: () => _confirm(ride),
                  ),
      ),
    );
  }
}

class _Content extends StatelessWidget {
  final Trip ride;
  final int seats;
  final String? error;
  final ValueChanged<int> onSeatsChanged;
  final VoidCallback onConfirm;

  const _Content({
    required this.ride,
    required this.seats,
    required this.error,
    required this.onSeatsChanged,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    const serviceFeePercent = 0.10; // 10% platform fee
    final subtotal = ride.price * seats;
    final serviceFee = subtotal * serviceFeePercent;
    final total = subtotal + serviceFee;

    final time =
        '${ride.departureTime.hour.toString().padLeft(2, '0')}:${ride.departureTime.minute.toString().padLeft(2, '0')}';

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(AppConstants.spacing16),
            children: [
              _RouteCard(from: ride.fromCity, to: ride.toCity, time: time),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Sürücü',
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                      child: Text(
                        ride.driver.name[0],
                        style: const TextStyle(
                          color: AppTheme.tealDark,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ride.driver.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  size: 14, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(
                                '${ride.driver.rating.toStringAsFixed(1)} · ${ride.driver.tripCount} səyahət',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.slate500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Sərnişin sayı',
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '$seats yer',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: seats > 1
                              ? () => onSeatsChanged(seats - 1)
                              : null,
                          icon: const Icon(Icons.remove_circle_outline),
                        ),
                        Text(
                          '$seats',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: seats < ride.availableSeats
                              ? () => onSeatsChanged(seats + 1)
                              : null,
                          icon: const Icon(Icons.add_circle_outline),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Detallar',
                child: Column(
                  children: [
                    _row('Avtomobil', 'Toyota Camry'),
                    const SizedBox(height: 8),
                    _row('Baqaj', 'Orta ölçülü'),
                    const SizedBox(height: 8),
                    _row('Bir yer', '${ride.price.toStringAsFixed(0)} AZN'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Qiymət',
                child: Column(
                  children: [
                    _row('${ride.price.toStringAsFixed(0)} AZN × $seats yer',
                        '${subtotal.toStringAsFixed(2)} AZN'),
                    const SizedBox(height: 8),
                    _row('Platforma xidmət haqqı (10%)',
                        '${serviceFee.toStringAsFixed(2)} AZN'),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Cəmi',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${total.toStringAsFixed(2)} AZN',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.tealDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.slate100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline,
                        size: 18, color: AppTheme.slate500),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Səyahətdən 24 saat əvvələ qədər ödənişsiz ləğv.',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.slate700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.error_outline,
                        size: 18, color: Colors.red.shade600),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(error!,
                          style: TextStyle(color: Colors.red.shade600)),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        _BottomBar(total: total, onConfirm: onConfirm),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: AppTheme.slate500)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _RouteCard extends StatelessWidget {
  final String from;
  final String to;
  final String time;

  const _RouteCard({required this.from, required this.to, required this.time});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing16),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _city(from, time),
          const Icon(Icons.arrow_forward, color: AppTheme.tealLight),
          _city(to, '', alignEnd: true),
        ],
      ),
    );
  }

  Widget _city(String name, String time, {bool alignEnd = false}) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          name,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
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

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _SectionCard({required this.title, required this.child});

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
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.slate500,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final double total;
  final VoidCallback onConfirm;

  const _BottomBar({required this.total, required this.onConfirm});

  @override
  Widget build(BuildContext context) {
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
                    Text('Cəmi',
                        style:
                            TextStyle(fontSize: 12, color: AppTheme.slate500)),
                    Text(
                      '${total.toStringAsFixed(0)} AZN',
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
                    onPressed: onConfirm,
                    child: const Text('Təsdiqlə'),
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
