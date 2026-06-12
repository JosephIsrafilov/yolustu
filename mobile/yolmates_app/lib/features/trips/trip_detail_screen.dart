import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/data/mock_data.dart';
import '../../shared/models/trip.dart';
import '../../shared/widgets/error_state.dart';

/// Ride detail with driver card, car/seat/preference blocks and a pinned
/// booking bar. Resolves the ride from the mock dataset by [tripId].
class TripDetailScreen extends StatelessWidget {
  final String tripId;

  const TripDetailScreen({required this.tripId, super.key});

  @override
  Widget build(BuildContext context) {
    final ride = MockData.rideById(tripId);

    if (ride == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Səyahət detalları')),
        body: ErrorStateView(
          title: 'Səyahət tapılmadı',
          message: 'Bu səyahət artıq mövcud deyil.',
          onRetry: () => context.pop(),
          retryLabel: 'Geri qayıt',
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Səyahət detalları')),
      body: _Body(ride: ride),
      bottomNavigationBar: _BookingBar(ride: ride),
    );
  }
}

class _Body extends StatelessWidget {
  final Trip ride;

  const _Body({required this.ride});

  @override
  Widget build(BuildContext context) {
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
                    Text('~4 saat',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7))),
                  ],
                ),
                _CityTime(city: ride.toCity, time: '', alignEnd: true),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(AppConstants.spacing24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionTitle('Sürücü'),
                const SizedBox(height: 12),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                      child: Text(
                        ride.driver.name[0],
                        style: const TextStyle(
                          color: AppTheme.tealDark,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ride.driver.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  size: 16, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(
                                '${ride.driver.rating.toStringAsFixed(1)} · ${ride.driver.tripCount} səyahət',
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () =>
                          context.push('/messages/conv-${ride.id}'),
                      icon: const Icon(Icons.message_outlined),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _SectionTitle('Səyahət məlumatları'),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_seat,
                  label: 'Boş yerlər',
                  value: '${ride.availableSeats} yer',
                ),
                _DetailRow(
                  icon: Icons.directions_car,
                  label: 'Avtomobil',
                  value: 'Toyota Camry',
                ),
                _DetailRow(
                  icon: Icons.luggage,
                  label: 'Baqaj',
                  value: 'Orta ölçülü çamadan',
                ),
                const SizedBox(height: 24),
                _SectionTitle('Üstünlüklər'),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    _PrefChip(icon: Icons.smoke_free, label: 'Siqaret yox'),
                    _PrefChip(icon: Icons.music_note, label: 'Musiqi var'),
                    _PrefChip(icon: Icons.luggage, label: 'Baqaj olar'),
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

class _BookingBar extends StatelessWidget {
  final Trip ride;

  const _BookingBar({required this.ride});

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
                    Text('Qiymət',
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
                    onPressed: ride.availableSeats > 0
                        ? () => context.push('/booking/confirm/${ride.id}')
                        : null,
                    child: Text(
                        ride.availableSeats > 0 ? 'Rezerv et' : 'Yer yoxdur'),
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
