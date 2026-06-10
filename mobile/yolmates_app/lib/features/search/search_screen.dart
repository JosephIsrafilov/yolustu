import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String _from = 'Bakı';
  String _to = 'Gəncə';
  DateTime _date = DateTime.now();
  int _passengers = 1;

  final List<String> _cities = [
    'Bakı',
    'Gəncə',
    'Sumqayıt',
    'Mingəçevir',
    'Şəki',
    'Quba',
    'Lənkəran',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Səyahət axtar'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // From city
            _buildCitySelector(
              label: 'Haradan',
              value: _from,
              onChanged: (value) => setState(() => _from = value!),
            ),
            const SizedBox(height: 16),

            // To city
            _buildCitySelector(
              label: 'Hara',
              value: _to,
              onChanged: (value) => setState(() => _to = value!),
            ),
            const SizedBox(height: 16),

            // Date
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: AppTheme.slate200),
              ),
              leading: const Icon(Icons.calendar_today),
              title: const Text('Tarix'),
              subtitle: Text(
                '${_date.day}.${_date.month}.${_date.year}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 90)),
                );
                if (picked != null) {
                  setState(() => _date = picked);
                }
              },
            ),
            const SizedBox(height: 16),

            // Passengers
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.slate200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Sərnişin sayı',
                    style: TextStyle(fontSize: 16),
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: _passengers > 1
                            ? () => setState(() => _passengers--)
                            : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text(
                        '$_passengers',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        onPressed: _passengers < 4
                            ? () => setState(() => _passengers++)
                            : null,
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Search button
            ElevatedButton(
              onPressed: () {
                context.push('/trips?from=$_from&to=$_to');
              },
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search),
                  SizedBox(width: 8),
                  Text('Axtar', style: TextStyle(fontSize: 16)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCitySelector({
    required String label,
    required String value,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.location_on),
      ),
      items: _cities.map((city) {
        return DropdownMenuItem(value: city, child: Text(city));
      }).toList(),
      onChanged: onChanged,
    );
  }
}
