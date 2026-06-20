import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/network/api_exception.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/repositories/rides_repository.dart';
import '../../shared/models/trip.dart';
import '../wallet/data/wallet_controller.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import '../chat/data/chat_repository.dart';
import '../../core/utils/date_utils.dart';
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
  List<String> _selectedSpots = const [];
  bool _submitting = false;
  String? _error;

  static const _seatOrder = [
    'front_right',
    'back_left',
    'back_middle',
    'back_right',
  ];

  List<String> _availableSpotsFor(Trip ride) {
    if (ride.availableSpots.isNotEmpty) return ride.availableSpots;
    return _seatOrder.take(ride.availableSeats).toList();
  }

  void _setSeats(Trip ride, int seats) {
    setState(() {
      _seats = seats;
      _selectedSpots = _selectedSpots
          .where(_availableSpotsFor(ride).contains)
          .take(seats)
          .toList();
      _error = null;
    });
  }

  void _toggleSpot(Trip ride, String spot) {
    final available = _availableSpotsFor(ride);
    if (!available.contains(spot)) return;
    setState(() {
      final next = [..._selectedSpots];
      if (next.contains(spot)) {
        next.remove(spot);
      } else {
        if (next.length == _seats) next.removeAt(0);
        next.add(spot);
      }
      _selectedSpots = next;
      _error = null;
    });
  }

  Future<void> _confirm(Trip ride) async {
    if (_selectedSpots.length != _seats) {
      setState(() => _error = 'Zəhmət olmasa $_seats yer seçin.');
      return;
    }

    // Check wallet balance before booking
    final total = ride.price * _seats;
    final walletState = ref.read(walletControllerProvider).valueOrNull;
    if (walletState != null && walletState.balance.balance < total) {
      _showErrorDialog('Balans kifayət deyil',
          'Balansınız kifayət deyil. ${total.toStringAsFixed(2)} AZN lazımdır, lakin ${walletState.balance.balance.toStringAsFixed(2)} AZN var.');
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
        selectedSpots: _selectedSpots,
        pricePerSeat: ride.price,
        status: BookingStatus.pending,
        createdAt: DateTime.now(),
      );
      final created = await ref
          .read(bookingsControllerProvider.notifier)
          .createBooking(booking);
      if (!mounted) return;
      ref.invalidate(rideByIdProvider(ride.id));
      await _showSuccess(created.selectedSpots);
      if (!mounted) return;

      // Navigate to chat and send automated message
      final chatRepo = ref.read(chatRepositoryProvider);
      final conversation = await chatRepo.getOrCreateRideConversation(
        rideId: created.rideId,
        bookingId: created.id,
      );

      final time =
          AppDateUtils.formatLocalDateTime(ride.departureTime, format: 'HH:mm');
      final date = AppDateUtils.formatLocalDateTime(ride.departureTime,
          format: 'dd.MM.yyyy');
      final msg = [
        'Sifariş detalı:',
        'Marşrut: ${ride.fromCity} - ${ride.toCity}',
        'Vaxt: $date $time',
        'Yer sayı: $_seats',
        'Yer: ${_selectedSpots.map(_seatLabel).join(', ')}',
        'Qiymət: ${ride.price.toStringAsFixed(0)} AZN/yer',
      ].join('\n');
      await chatRepo.sendMessage(conversation.id, msg);

      if (!mounted) return;
      context.go('${AppRoutes.messages}/${conversation.id}');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (_isSeatConflict(e)) {
        ref.invalidate(rideByIdProvider(ride.id));
        final refreshed = await ref.read(rideByIdProvider(ride.id).future);
        if (!mounted) return;
        setState(() {
          final available = refreshed == null
              ? const <String>[]
              : _availableSpotsFor(refreshed);
          _selectedSpots =
              _selectedSpots.where(available.contains).take(_seats).toList();
          if (available.isNotEmpty && _seats > available.length) {
            _seats = available.length;
            _selectedSpots = _selectedSpots.take(_seats).toList();
          }
          _error = 'Seçdiyiniz yerlərdən biri artıq tutulub. Yerlər yeniləndi.';
        });
      } else {
        _showErrorDialog(
            'Xəta', 'Rezervasiya yaradıla bilmədi. Səbəb: ${e.message}');
      }
    } catch (e) {
      if (!mounted) return;
      _showErrorDialog(
          'Xəta', 'Rezervasiya yaradıla bilmədi. Səbəb: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  bool _isSeatConflict(ApiException error) {
    final message = error.message.toLowerCase();
    return error.statusCode == 409 ||
        message.contains('selected seat is not available') ||
        message.contains('not enough available seats');
  }

  void _showErrorDialog(String title, String message) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.error_outline,
                  color: Colors.red.shade400, size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.navy),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: const TextStyle(fontSize: 14, color: AppTheme.slate500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade400,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Bağla'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showSuccess(List<String> selectedSpots) {
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
              'Yerlər: ${selectedSpots.map(_seatLabel).join(', ')}\n'
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
                    selectedSpots: _selectedSpots,
                    error: _error,
                    onSeatsChanged: (s) => _setSeats(ride, s),
                    onSpotToggle: (spot) => _toggleSpot(ride, spot),
                    onConfirm: () => _confirm(ride),
                  ),
      ),
    );
  }
}

String _seatLabel(String spot) {
  switch (spot) {
    case 'front_right':
      return 'Ön sağ';
    case 'back_left':
      return 'Arxa sol';
    case 'back_middle':
      return 'Arxa orta';
    case 'back_right':
      return 'Arxa sağ';
    default:
      return spot;
  }
}

class _Content extends StatelessWidget {
  final Trip ride;
  final int seats;
  final List<String> selectedSpots;
  final String? error;
  final ValueChanged<int> onSeatsChanged;
  final ValueChanged<String> onSpotToggle;
  final VoidCallback onConfirm;

  const _Content({
    required this.ride,
    required this.seats,
    required this.selectedSpots,
    required this.error,
    required this.onSeatsChanged,
    required this.onSpotToggle,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final total = ride.price * seats;
    final isValid = selectedSpots.length == seats && seats > 0;

    final time =
        AppDateUtils.formatLocalDateTime(ride.departureTime, format: 'HH:mm');

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
                title: 'Yer seçimi',
                child: _SeatPicker(
                  totalSeats: ride.totalSeats,
                  availableSpots: ride.availableSpots.isNotEmpty
                      ? ride.availableSpots
                      : _BookingConfirmScreenState._seatOrder
                          .take(ride.availableSeats)
                          .toList(),
                  selectedSpots: selectedSpots,
                  onToggle: onSpotToggle,
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
                        '${total.toStringAsFixed(2)} AZN'),
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
        _BottomBar(
          total: total,
          onConfirm: isValid ? onConfirm : null,
        ),
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

class _SeatPicker extends StatelessWidget {
  final int totalSeats;
  final List<String> availableSpots;
  final List<String> selectedSpots;
  final ValueChanged<String> onToggle;

  const _SeatPicker({
    required this.totalSeats,
    required this.availableSpots,
    required this.selectedSpots,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final seats = _BookingConfirmScreenState._seatOrder.take(totalSeats);

    return Column(
      children: [
        Container(
          width: 92,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppTheme.slate100,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.slate200),
          ),
          child: const Text(
            'Sürücü',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 10,
          runSpacing: 10,
          children: seats.map((spot) {
            final available = availableSpots.contains(spot);
            final selected = selectedSpots.contains(spot);
            return _SeatChip(
              label: _seatLabel(spot),
              available: available,
              selected: selected,
              onTap: available ? () => onToggle(spot) : null,
            );
          }).toList(),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _LegendDot(color: AppTheme.teal, label: 'Seçilib'),
            const SizedBox(width: 12),
            _LegendDot(color: AppTheme.slate200, label: 'Boş'),
            const SizedBox(width: 12),
            _LegendDot(color: AppTheme.slate500, label: 'Tutulub'),
          ],
        ),
      ],
    );
  }
}

class _SeatChip extends StatelessWidget {
  final String label;
  final bool available;
  final bool selected;
  final VoidCallback? onTap;

  const _SeatChip({
    required this.label,
    required this.available,
    required this.selected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final background = selected
        ? AppTheme.teal
        : available
            ? Colors.white
            : AppTheme.slate200;
    final foreground = selected
        ? Colors.white
        : available
            ? AppTheme.navy
            : AppTheme.slate500;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 104,
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected
                ? AppTheme.teal
                : available
                    ? AppTheme.slate200
                    : Colors.transparent,
          ),
          boxShadow: available && !selected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          !available && !selected ? 'Reserved' : label,
          style: TextStyle(
            color: foreground,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
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
  final VoidCallback? onConfirm;

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
