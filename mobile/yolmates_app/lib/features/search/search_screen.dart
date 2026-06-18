import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/app_localizations.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../shared/widgets/city_dropdown.dart';
import '../../shared/widgets/date_selector.dart';
import 'data/recent_searches_repository.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  String? _from;
  String? _to;
  DateSelection? _dateSelection;
  int _passengers = 1;

  void _search() async {
    final l10n = ref.read(l10nProvider);
    if (_from == null || _to == null) return;
    if (_from == _to && _from != l10n.allCities) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.searchSameLocationError)),
      );
      return;
    }

    final repo = ref.read(recentSearchesRepositoryProvider);
    await repo.addSearch(_from!, _to!);
    ref.invalidate(recentSearchesProvider);

    if (mounted) {
      String route =
          '${AppRoutes.rideResults}?from=$_from&to=$_to&passengers=$_passengers';
      if (_dateSelection != null) {
        if (_dateSelection!.date != null) {
          route += '&date=${_dateSelection!.date!.toIso8601String()}';
        }
        if (_dateSelection!.dateTo != null) {
          route += '&dateTo=${_dateSelection!.dateTo!.toIso8601String()}';
        }
      }
      context.push(route);
    }
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
            Consumer(
              builder: (context, ref, _) {
                final recentAsync = ref.watch(recentSearchesProvider);
                return recentAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (searches) {
                    if (searches.isEmpty) return const SizedBox.shrink();
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.searchRecentSearches,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.navy,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: searches.take(3).map((search) {
                            return InkWell(
                              onTap: () {
                                setState(() {
                                  _from = search.fromCity;
                                  _to = search.toCity;
                                });
                              },
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.teal.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: AppTheme.teal.withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.history,
                                      size: 14,
                                      color: AppTheme.tealDark,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${search.fromCity} → ${search.toCity}',
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppTheme.tealDark,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  },
                );
              },
            ),
            CityDropdown(
              label: l10n.searchFromLabel,
              value: _from,
              icon: Icons.location_on_outlined,
              allowAll: true,
              onChanged: (value) => setState(() => _from = value),
            ),
            const SizedBox(height: 8),
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
            CityDropdown(
              label: l10n.searchToLabel,
              value: _to,
              icon: Icons.location_on,
              allowAll: true,
              onChanged: (value) => setState(() => _to = value),
            ),
            DateSelector(
              selectedDate: _dateSelection,
              onChanged: (val) => setState(() => _dateSelection = val),
              isDark: false,
            ),
            const SizedBox(height: 16),
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
            ElevatedButton(
              onPressed: (_from == null || _to == null) ? null : _search,
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
}
