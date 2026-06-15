import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/app_localizations.dart';
import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../shared/widgets/empty_state.dart';

/// User reviews summary + list (mock).
class ReviewsScreen extends ConsumerWidget {
  const ReviewsScreen({super.key});

  static const _reviews = [
    ('Aysel M.', 5, 'Çox rahat səyahət idi, vaxtında gəldi. Təşəkkürlər!'),
    ('Elçin H.', 4, 'Yaxşı sürücü, maşın təmiz. Tövsiyə edirəm.'),
    ('Nigar Ə.', 5, 'Hər şey əla idi, mütləq yenidən səyahət edəcəyəm.'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    // Mock aggregate.
    const avg = 4.9;
    const count = 156;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.commonReviews)),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _SummaryCard(average: avg, count: count),
          const SizedBox(height: 20),
          if (_reviews.isEmpty)
            const EmptyState(
              icon: Icons.reviews_outlined,
              title: 'Hələ rəy yoxdur',
              message:
                  'Tamamlanmış səyahətlərdən sonra rəylər burada görünəcək.',
            )
          else
            ..._reviews.map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _ReviewCard(name: r.$1, stars: r.$2, text: r.$3),
                )),
        ],
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
