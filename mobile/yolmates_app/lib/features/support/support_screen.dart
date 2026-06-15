import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';

class SupportScreen extends ConsumerWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final faqs = [
      (l10n.supportFaqBookingQuestion, l10n.supportFaqBookingAnswer),
      (l10n.supportFaqPaymentQuestion, l10n.supportFaqPaymentAnswer),
      (l10n.supportFaqCancelQuestion, l10n.supportFaqCancelAnswer),
      (l10n.supportFaqDriverQuestion, l10n.supportFaqDriverAnswer),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.supportTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _ContactCard(
            supportTitle: l10n.supportContactWrite,
            reportTitle: l10n.supportReportIssue,
            reportSubtitle: l10n.supportReportIssueSubtitle,
            comingSoon: l10n.supportComingSoon,
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              l10n.supportFaqTitle,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.slate500,
              ),
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slate200),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (final faq in faqs)
                  ExpansionTile(
                    title: Text(
                      faq.$1,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    expandedAlignment: Alignment.topLeft,
                    children: [
                      Text(
                        faq.$2,
                        style: TextStyle(color: AppTheme.slate700, height: 1.5),
                      ),
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

class _ContactCard extends StatelessWidget {
  final String supportTitle;
  final String reportTitle;
  final String reportSubtitle;
  final String comingSoon;

  const _ContactCard({
    required this.supportTitle,
    required this.reportTitle,
    required this.reportSubtitle,
    required this.comingSoon,
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
        children: [
          _row(
            context,
            icon: Icons.headset_mic_outlined,
            title: supportTitle,
            subtitle: 'support@yolmates.az',
          ),
          Divider(height: 24, color: AppTheme.slate100),
          _row(
            context,
            icon: Icons.report_problem_outlined,
            title: reportTitle,
            subtitle: reportSubtitle,
          ),
        ],
      ),
    );
  }

  Widget _row(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return InkWell(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(comingSoon)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.teal.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.tealDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 13, color: AppTheme.slate500),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: AppTheme.slate500),
        ],
      ),
    );
  }
}
