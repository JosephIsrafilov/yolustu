import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../shared/models/trip.dart';
import '../../shared/models/user.dart';

class TripListScreen extends StatelessWidget {
  final String fromCity;
  final String toCity;

  const TripListScreen({
    required this.fromCity,
    required this.toCity,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    // Mock trips
    final trips = List.generate(
      5,
      (i) => Trip(
        id: 'trip-$i',
        driver: User(
          id: 'user-$i',
          name: 'Sürücü ${i + 1}',
          phone: '+994501234567',
          rating: 4.5 + (i * 0.1),
          tripCount: 50 + i * 10,
        ),
        fromCity: fromCity,
        toCity: toCity,
        departureTime: DateTime.now().add(Duration(hours: i + 2)),
        price: 10.0 + (i * 2),
        availableSeats: 3 - i % 3,
        totalSeats: 4,
        status: 'active',
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('$fromCity → $toCity'),
      ),
      body: trips.isEmpty
          ? const Center(
              child: Text('Səyahət tapılmadı'),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: trips.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final trip = trips[index];
                return _TripCard(trip: trip);
              },
            ),
    );
  }
}

class _TripCard extends StatelessWidget {
  final Trip trip;

  const _TripCard({required this.trip});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () => context.push('/trips/${trip.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Driver info
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppTheme.teal.withOpacity(0.2),
                    child: Text(
                      trip.driver.name[0],
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
                          trip.driver.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star, size: 14, color: Colors.amber),
                            const SizedBox(width: 4),
                            Text(
                              '${trip.driver.rating.toStringAsFixed(1)} · ${trip.driver.tripCount} səyahət',
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${trip.price.toStringAsFixed(0)} AZN',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.tealDark,
                        ),
                      ),
                      const Text(
                        'Oturacaq',
                        style: TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
              const Divider(height: 24),

              // Trip details
              Row(
                children: [
                  const Icon(Icons.access_time, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '${trip.departureTime.hour}:${trip.departureTime.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(fontSize: 15),
                  ),
                  const SizedBox(width: 24),
                  const Icon(Icons.event_seat, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    '${trip.availableSeats} boş yer',
                    style: const TextStyle(fontSize: 15),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
