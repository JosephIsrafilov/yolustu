import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';
import 'data/reviews_repository.dart';

final selectedStarFilterProvider = StateProvider.autoDispose<int>((ref) => 0);

/// User reviews summary + list (dynamic).
class ReviewsScreen extends ConsumerWidget {
  const ReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final reviewsAsync = ref.watch(userReviewsProvider);
    final selectedStar = ref.watch(selectedStarFilterProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.commonReviews)),
      body: reviewsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Xəta baş verdi: $e')),
        data: (reviews) {
          final count = reviews.length;
          final avg = count == 0
              ? 0.0
              : reviews.map((e) => e.rating).reduce((a, b) => a + b) / count;

          final filteredReviews = selectedStar == 0
              ? reviews
              : reviews.where((r) => r.rating == selectedStar).toList();

          return ListView(
            padding: const EdgeInsets.all(AppConstants.spacing16),
            children: [
              _SummaryCard(average: avg, count: count),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                        label: 'Hamısı', value: 0, selected: selectedStar),
                    _FilterChip(
                        label: '5 Ulduz', value: 5, selected: selectedStar),
                    _FilterChip(
                        label: '4 Ulduz', value: 4, selected: selectedStar),
                    _FilterChip(
                        label: '3 Ulduz', value: 3, selected: selectedStar),
                    _FilterChip(
                        label: '2 Ulduz', value: 2, selected: selectedStar),
                    _FilterChip(
                        label: '1 Ulduz', value: 1, selected: selectedStar),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (filteredReviews.isEmpty)
                const EmptyState(
                  icon: Icons.reviews_outlined,
                  title: 'Hələ rəy yoxdur',
                  message: 'Bu filtrə uyğun rəy tapılmadı.',
                )
              else
                ...filteredReviews.map((r) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ReviewCard(
                          name: r.authorName, stars: r.rating, text: r.comment),
                    )),
            ],
          );
        },
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final double average;
  final int count;

  const _SummaryCard({required this.average, required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.spacing24),
      decoration: BoxDecoration(
        color: AppTheme.navy,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                average.toStringAsFixed(1),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < average.round() ? Icons.star : Icons.star_border,
                    size: 16,
                    color: Colors.amber,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Text(
              '$count rəy əsasında',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final String name;
  final int stars;
  final String text;

  const _ReviewCard({
    required this.name,
    required this.stars,
    required this.text,
  });

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
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.teal.withValues(alpha: 0.2),
                child: Text(
                  name[0],
                  style: const TextStyle(
                    color: AppTheme.tealDark,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(name,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
              Row(
                children: List.generate(
                  stars,
                  (_) => const Icon(Icons.star, size: 14, color: Colors.amber),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(text, style: TextStyle(color: AppTheme.slate700, height: 1.4)),
        ],
      ),
    );
  }
}

class _FilterChip extends ConsumerWidget {
  final String label;
  final int value;
  final int selected;

  const _FilterChip({
    required this.label,
    required this.value,
    required this.selected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSelected = value == selected;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.navy,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        selected: isSelected,
        onSelected: (_) {
          ref.read(selectedStarFilterProvider.notifier).state = value;
        },
        selectedColor: AppTheme.teal,
        backgroundColor: AppTheme.teal.withValues(alpha: 0.1),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        side: BorderSide.none,
      ),
    );
  }
}
