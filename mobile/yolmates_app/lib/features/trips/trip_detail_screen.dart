import 'package:flutter/material.dart';
import '../../core/theme.dart';

class TripDetailScreen extends StatelessWidget {
  final String tripId;

  const TripDetailScreen({required this.tripId, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Səyahət detalları'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Route info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              color: AppTheme.slate50,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bakı',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text('08:00'),
                        ],
                      ),
                      Column(
                        children: [
                          Icon(Icons.arrow_forward, color: AppTheme.slate500),
                          const Text('~4 saat'),
                        ],
                      ),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Gəncə',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text('12:00'),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Driver info
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sürücü',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: AppTheme.teal.withOpacity(0.2),
                        child: const Text(
                          'RS',
                          style: TextStyle(
                            color: AppTheme.tealDark,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Rashad Suleymanov',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.star, size: 16, color: Colors.amber),
                                SizedBox(width: 4),
                                Text('4.9 · 156 səyahət'),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.message),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Trip details
                  const Text(
                    'Səyahət məlumatları',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _DetailRow(
                    icon: Icons.event_seat,
                    label: 'Boş yerlər',
                    value: '3 yer',
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
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Qiymət',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.slate500,
                      ),
                    ),
                    const Text(
                      '15 AZN',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.tealDark,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Rezerv et'),
                ),
              ),
            ],
          ),
        ),
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
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
