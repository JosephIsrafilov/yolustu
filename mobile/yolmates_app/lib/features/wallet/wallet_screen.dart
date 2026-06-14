import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import '../auth/data/auth_mode.dart';
import 'data/wallet_controller.dart';

/// Wallet screen with balance and transaction history.
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    final walletAsync = ref.watch(walletControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.walletTitle)),
      body: walletAsync.when(
        loading: () => const LoadingView(),
        error: (err, stack) => ErrorStateView(
          title: 'Xəta baş verdi',
          message: err.toString(),
          onRetry: () => ref.invalidate(walletControllerProvider),
        ),
        data: (walletState) {
          final balance = walletState.balance;
          final transactions = walletState.transactions;

          return RefreshIndicator(
            onRefresh: () => ref.read(walletControllerProvider.notifier).refresh(),
            child: ListView(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              children: [
                if (!AuthMode.isApi) _MockBanner(message: l10n.walletMockBanner),
                if (!AuthMode.isApi) const SizedBox(height: 16),
                _BalanceCard(
                  balanceLabel: l10n.walletBalance,
                  amount: balance.availableBalance,
                  currency: balance.currency,
                  topUpLabel: l10n.walletTopUpBtn,
                  comingSoonLabel: l10n.walletComingSoon,
                ),
                const SizedBox(height: 20),
                Text(
                  l10n.walletPaymentMethod,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.navy,
                      ),
                ),
                const SizedBox(height: 8),
                AppCard(
                  padding: const EdgeInsets.all(AppConstants.spacing16),
                  child: Row(
                    children: [
                      Icon(Icons.credit_card, color: AppTheme.slate500),
                      const SizedBox(width: 12),
                      Expanded(child: Text(l10n.walletNoCard)),
                      TextButton(
                        onPressed: null,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(l10n.walletAddCard),
                            const SizedBox(width: 4),
                            Text(
                              '(${l10n.walletComingSoon})',
                              style: TextStyle(fontSize: 11, color: AppTheme.slate500),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  l10n.walletTransactions,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.navy,
                      ),
                ),
                const SizedBox(height: 8),
                if (transactions.isEmpty)
                  const EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: 'Əməliyyat yoxdur',
                    message: 'Hələ heç bir əməliyyat edilməyib',
                  )
                else
                  ...transactions.map((txn) => _TxnRow(transaction: txn)),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MockBanner extends StatelessWidget {
  final String message;
  const _MockBanner({required this.message});

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
              message,
              style: TextStyle(fontSize: 13, color: Colors.orange.shade900),
            ),
          ),
        ],
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final String balanceLabel;
  final double amount;
  final String currency;
  final String topUpLabel;
  final String comingSoonLabel;

  const _BalanceCard({
    required this.balanceLabel,
    required this.amount,
    required this.currency,
    required this.topUpLabel,
    required this.comingSoonLabel,
  });

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
          Text(balanceLabel,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.8))),
          const SizedBox(height: 8),
          Text(
            '${amount.toStringAsFixed(2)} $currency',
            style: const TextStyle(
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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(topUpLabel),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      comingSoonLabel,
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TxnRow extends StatelessWidget {
  final dynamic transaction;

  const _TxnRow({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.isCredit;
    final label = transaction.description ?? transaction.type.label;
    final amount = transaction.amount;
    final currency = transaction.currency;
    final date = DateFormat('dd MMM, HH:mm').format(transaction.createdAt);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: (isCredit ? Colors.green : AppTheme.slate500)
                  .withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              size: 18,
              color: isCredit ? Colors.green.shade700 : AppTheme.slate700,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(date, style: TextStyle(fontSize: 12, color: AppTheme.slate500)),
              ],
            ),
          ),
          Text(
            '${amount >= 0 ? '+' : ''}${amount.toStringAsFixed(2)} $currency',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: isCredit ? Colors.green.shade700 : AppTheme.navy,
            ),
          ),
        ],
      ),
    );
  }
}
