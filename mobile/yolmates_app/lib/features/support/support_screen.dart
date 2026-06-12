import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';

/// Help & support center (mock content).
class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  static const _faqs = [
    (
      'Rezervasiyanı necə edə bilərəm?',
      'Səyahət axtarın, uyğun reisi seçin və "Rezerv et" düyməsinə basın. '
          'Sürücü təsdiqlədikdən sonra ödəniş edə bilərsiniz.',
    ),
    (
      'Ödənişi necə edirəm?',
      'Rezervasiya təsdiqləndikdən sonra rezervasiya detallarında ödəniş '
          'düyməsi görünəcək. Hazırda ödəniş mock rejimindədir.',
    ),
    (
      'Rezervasiyamı ləğv edə bilərəmmi?',
      'Bəli. Səyahətdən 24 saat əvvələ qədər ödənişsiz ləğv edə bilərsiniz.',
    ),
    (
      'Sürücü necə ola bilərəm?',
      'Profil → Sürücü rejimi bölməsindən qeydiyyatdan keçin, avtomobil '
          'əlavə edin və yoxlamadan keçin.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kömək')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          _ContactCard(),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 8),
            child: Text(
              'Tez-tez verilən suallar',
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
                for (final faq in _faqs)
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
            title: 'Dəstəyə yaz',
            subtitle: 'support@yolmates.az',
          ),
          Divider(height: 24, color: AppTheme.slate100),
          _row(
            context,
            icon: Icons.report_problem_outlined,
            title: 'Problem bildir',
            subtitle: 'Nasazlıq və ya şikayət göndərin',
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
        const SnackBar(content: Text('Tezliklə əlçatan olacaq')),
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
                Text(title,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w600)),
                Text(subtitle,
                    style: TextStyle(fontSize: 13, color: AppTheme.slate500)),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: AppTheme.slate500),
        ],
      ),
    );
  }
}
