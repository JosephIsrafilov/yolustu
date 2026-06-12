import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';

/// Wallet placeholder (clearly marked not connected).
class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  static const _transactions = [
    ('Bakı → Gəncə', '-15 AZN', false),
    ('Balans artımı', '+50 AZN', true),
    ('Bakı → Quba', '-10 AZN', false),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pul kisəsi')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.spacing16),
        children: [
          const _MockBanner(),
          const SizedBox(height: 16),
          _BalanceCard(),
          const SizedBox(height: 20),
          Text(
            'Ödəniş üsulu',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.navy,
                ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(AppConstants.spacing16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slate200),
            ),
            child: Row(
              children: [
                Icon(Icons.credit_card, color: AppTheme.slate500),
                const SizedBox(width: 12),
                const Expanded(child: Text('Kart əlavə edilməyib')),
                TextButton(onPressed: null, child: const Text('Əlavə et')),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Əməliyyatlar',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppTheme.navy,
                ),
          ),
          const SizedBox(height: 8),
          ..._transactions.map((t) => _TxnRow(
                label: t.$1,
                amount: t.$2,
                credit: t.$3,
              )),
        ],
      ),
    );
  }
}

class _MockBanner extends StatelessWidget {
  const _MockBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 18, color: Colors.orange.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Demo rejimi — ödənişlər hələ qoşulmayıb.',
              style: TextStyle(fontSize: 13, color: Colors.orange.shade900),
            ),
          ),
        ],
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppConstants.spacing24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.tealDark, AppTheme.teal],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Balans',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.8))),
          const SizedBox(height: 8),
          const Text(
            '25.00 AZN',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: null,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: BorderSide(color: Colors.white.withValues(alpha: 0.5)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('Balansı artır'),
            ),
          ),
        ],
      ),
    );
  }
}

class _TxnRow extends StatelessWidget {
  final String label;
  final String amount;
  final bool credit;

  const _TxnRow({
    required this.label,
    required this.amount,
    required this.credit,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: (credit ? Colors.green : AppTheme.slate500)
                  .withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              credit ? Icons.arrow_downward : Icons.arrow_upward,
              size: 18,
              color: credit ? Colors.green.shade700 : AppTheme.slate700,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Text(
            amount,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: credit ? Colors.green.shade700 : AppTheme.navy,
            ),
          ),
        ],
      ),
    );
  }
}
