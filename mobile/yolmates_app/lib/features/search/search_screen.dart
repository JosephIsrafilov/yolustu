import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  String _from = 'Bakı';
  String _to = 'Gəncə';
  DateTime _date = DateTime.now();
  int _passengers = 1;

  final List<String> _cities = AppConstants.cities;

  static const _months = [
    'Yan',
    'Fev',
    'Mar',
    'Apr',
    'May',
    'İyn',
    'İyl',
    'Avq',
    'Sen',
    'Okt',
    'Noy',
    'Dek',
  ];
  static const _weekdays = [
    'B.e',
    'Ç.a',
    'Çər',
    'C.a',
    'Cüm',
    'Şən',
    'Baz',
  ];

  String get _dateLabel =>
      '${_weekdays[_date.weekday - 1]}, ${_date.day} ${_months[_date.month - 1]}';

  void _search() {
    final l10n = ref.read(l10nProvider);
    if (_from == _to) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.searchSameLocationError)),
      );
      return;
    }
    final dateStr = '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}';
    context.push(
      '${AppRoutes.rideResults}?from=$_from&to=$_to'
      '&passengers=$_passengers&date=$dateStr',
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.searchTitle),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // From city
            _buildCitySelector(
              label: l10n.searchFromLabel,
              value: _from,
              onChanged: (value) => setState(() => _from = value!),
            ),
            const SizedBox(height: 8),

            // Swap button
            Center(
              child: IconButton(
                onPressed: () => setState(() {
                  final temp = _from;
                  _from = _to;
                  _to = temp;
                }),
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.teal.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.swap_vert,
                    color: AppTheme.tealDark,
                  ),
                ),
                tooltip: l10n.searchSwapTooltip,
              ),
            ),
            const SizedBox(height: 8),

            // To city
            _buildCitySelector(
              label: l10n.searchToLabel,
              value: _to,
              onChanged: (value) => setState(() => _to = value!),
            ),
            const SizedBox(height: 16),

            // Date
            ListTile(
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: AppTheme.slate200),
              ),
              leading: const Icon(Icons.calendar_today),
              title: Text(l10n.searchDateLabel),
              subtitle: Text(
                _dateLabel,
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
                  Text(
                    l10n.searchPassengersLabel,
                    style: const TextStyle(fontSize: 16),
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
              onPressed: _search,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.search),
                  const SizedBox(width: 8),
                  Text(l10n.commonSearch, style: const TextStyle(fontSize: 16)),
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
      initialValue: value,
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
