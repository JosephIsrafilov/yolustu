import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/theme.dart';
import '../../core/utils/date_utils.dart';
import '../../shared/widgets/app_card.dart';
import '../auth/data/app_user.dart';
import '../auth/state/auth_controller.dart';
import '../notifications/notification_provider.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_view.dart';
import 'package:url_launcher/url_launcher.dart';
import 'data/wallet.dart';
import 'data/wallet_controller.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen>
    with WidgetsBindingObserver {
  String? _pendingSessionId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _pendingSessionId != null) {
      _checkPaymentStatus();
    }
  }

  Future<void> _checkPaymentStatus() async {
    if (_pendingSessionId == null) return;
    try {
      await ref
          .read(walletControllerProvider.notifier)
          .checkStripeTopUpStatus(_pendingSessionId!);
      ref
          .read(notificationProvider.notifier)
          .showSuccess('Stripe ödənişi tamamlandı');
    } catch (e) {
      ref.read(notificationProvider.notifier).showError(_stripeErrorMessage(e));
    }
    _pendingSessionId = null;
  }

  @override
  Widget build(BuildContext context) {
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
          final currentUser = ref.watch(authControllerProvider).user;
          final showDriverBalance = currentUser?.role == UserRole.driver &&
              currentUser?.verificationStatus == 'approved';

          return RefreshIndicator(
            onRefresh: () =>
                ref.read(walletControllerProvider.notifier).refresh(),
            child: ListView(
              padding: const EdgeInsets.all(AppConstants.spacing16),
              children: [
                _BalanceCard(
                  label: l10n.walletBalance,
                  description: l10n.walletPassengerBalanceDesc,
                  amount: balance.passengerBalance,
                  currency: balance.currency,
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.tealDark, AppTheme.teal],
                  ),
                  actionLabel: l10n.walletTopUpBtn,
                  actionIcon: Icons.add,
                  onAction: () => _showAmountSheet(
                    context: context,
                    title: l10n.walletTopUpBtn,
                    actionLabel: l10n.walletTopUpBtn,
                    quickAmounts: const [10, 25, 50, 100],
                    requireCard: true,
                    allowStripe: true,
                    cards: walletState.cards,
                    selectedCardId: walletState.selectedCard?.id,
                    onCardSelected: (cardId) => ref
                        .read(walletControllerProvider.notifier)
                        .selectCard(cardId),
                    onSubmit: (amount, method) async {
                      if (method == 'stripe') {
                        try {
                          final res = await ref
                              .read(walletControllerProvider.notifier)
                              .createStripeTopUp(amount);
                          final checkoutUrl = res['checkout_url'] as String;
                          final sessionId = res['session_id'] as String;
                          _pendingSessionId = sessionId;
                          final uri = Uri.parse(checkoutUrl);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          } else {
                            throw Exception('Could not open Stripe Checkout');
                          }
                        } catch (e) {
                          ref
                              .read(notificationProvider.notifier)
                              .showError(_stripeErrorMessage(e));
                        }
                      } else {
                        try {
                          await ref
                              .read(walletControllerProvider.notifier)
                              .topUpPassenger(amount);
                          final newBalance = ref
                              .read(walletControllerProvider)
                              .valueOrNull
                              ?.balance
                              .passengerBalance;
                          ref.read(notificationProvider.notifier).showSuccess(
                              newBalance == null
                                  ? 'Top-up successful: ${amount.toStringAsFixed(2)} AZN.'
                                  : 'Top-up successful: ${amount.toStringAsFixed(2)} AZN. New balance: ${newBalance.toStringAsFixed(2)} AZN.');
                        } catch (e) {
                          ref
                              .read(notificationProvider.notifier)
                              .showError('Xəta: ${e.toString()}');
                        }
                      }
                    },
                  ),
                  secondaryActionLabel:
                      showDriverBalance ? l10n.walletWithdraw : null,
                  secondaryActionIcon:
                      showDriverBalance ? Icons.arrow_upward : null,
                  onSecondaryAction: showDriverBalance &&
                          balance.passengerBalance > 0
                      ? () => _showAmountSheet(
                            context: context,
                            title: l10n.walletWithdraw,
                            actionLabel: l10n.walletWithdraw,
                            quickAmounts: const [10, 25, 50],
                            maxAmount: balance.passengerBalance,
                            cards: walletState.cards,
                            selectedCardId: walletState.selectedCard?.id,
                            requireCard: true,
                            allowStripe: false,
                            onSubmit: (amount, _) async {
                              await ref
                                  .read(walletControllerProvider.notifier)
                                  .withdrawDriver(amount);
                              ref.read(notificationProvider.notifier).showSuccess(
                                  'Withdrawal completed: ${amount.toStringAsFixed(2)} AZN.');
                            },
                            onCardSelected: (cardId) => ref
                                .read(walletControllerProvider.notifier)
                                .selectCard(cardId),
                          )
                      : null,
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
                  child: _PaymentMethodSection(
                    cards: walletState.cards,
                    selectedCard: walletState.selectedCard,
                    emptyLabel: l10n.walletNoCard,
                    addLabel: l10n.walletAddCard,
                    onSelect: (cardId) => ref
                        .read(walletControllerProvider.notifier)
                        .selectCard(cardId),
                    onAdd: () => _showAddCardSheet(
                      context: context,
                      onSubmit: (holderName, number, expiry) =>
                          ref.read(walletControllerProvider.notifier).addCard(
                                holderName: holderName,
                                number: number,
                                expiry: expiry,
                              ),
                    ),
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
                  EmptyState(
                    icon: Icons.receipt_long_outlined,
                    title: l10n.walletEmpty,
                    message: l10n.walletEmptyMessage,
                    actionLabel: l10n.walletRefresh,
                    onAction: () => ref.invalidate(walletControllerProvider),
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

  Future<void> _showAmountSheet({
    required BuildContext context,
    required String title,
    required String actionLabel,
    required List<double> quickAmounts,
    required Future<void> Function(double amount, String method) onSubmit,
    List<WalletCard> cards = const [],
    String? selectedCardId,
    void Function(String cardId)? onCardSelected,
    bool requireCard = false,
    bool allowStripe = false,
    double? maxAmount,
  }) async {
    final request = await showModalBottomSheet<_WalletActionRequest>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _AmountSheet(
        title: title,
        actionLabel: actionLabel,
        quickAmounts: quickAmounts,
        maxAmount: maxAmount,
        cards: cards,
        selectedCardId: selectedCardId,
        requireCard: requireCard,
        allowStripe: allowStripe,
      ),
    );

    if (request == null || !context.mounted) return;

    try {
      if (requireCard &&
          request.method == 'mock' &&
          request.cardId != null &&
          onCardSelected != null) {
        onCardSelected(request.cardId!);
      }
      await onSubmit(request.amount, request.method);
    } catch (e) {
      ref.read(notificationProvider.notifier).showError(e.toString());
    }
  }

  Future<void> _showAddCardSheet({
    required BuildContext context,
    required void Function(String holderName, String number, String expiry)
        onSubmit,
  }) async {
    final card = await showModalBottomSheet<_NewCardInput>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _AddCardSheet(),
    );

    if (card == null || !context.mounted) return;
    try {
      onSubmit(card.holderName, card.number, card.expiry);
      ref.read(notificationProvider.notifier).showSuccess('Card added.');
    } catch (e) {
      ref.read(notificationProvider.notifier).showError(e.toString());
    }
  }

  String _stripeErrorMessage(Object error) {
    final apiError = error is ApiException ? error : null;
    final message = error.toString();
    if (apiError?.statusCode == 404 ||
        apiError?.code == 'NOT_FOUND' ||
        message.toLowerCase().contains('not found')) {
      return 'Stripe ödənişi tapılmadı. API bağlantısını yoxlayın.';
    }
    if (message.toLowerCase().contains('pending')) {
      return 'Stripe payment is still pending. Try refreshing in a moment.';
    }
    if (message.toLowerCase().contains('cancel')) {
      return 'Stripe payment was cancelled.';
    }
    return 'Stripe payment failed: $message';
  }
}

class _WalletActionRequest {
  final double amount;
  final String? cardId;
  final String method;

  const _WalletActionRequest(
      {required this.amount, this.cardId, required this.method});
}

class _NewCardInput {
  final String holderName;
  final String number;
  final String expiry;

  const _NewCardInput({
    required this.holderName,
    required this.number,
    required this.expiry,
  });
}

class _AmountSheet extends StatefulWidget {
  final String title;
  final String actionLabel;
  final List<double> quickAmounts;
  final double? maxAmount;
  final List<WalletCard> cards;
  final String? selectedCardId;
  final bool requireCard;
  final bool allowStripe;

  const _AmountSheet({
    required this.title,
    required this.actionLabel,
    required this.quickAmounts,
    this.cards = const [],
    this.selectedCardId,
    this.requireCard = false,
    this.allowStripe = false,
    this.maxAmount,
  });

  @override
  State<_AmountSheet> createState() => _AmountSheetState();
}

class _AmountSheetState extends State<_AmountSheet> {
  late final TextEditingController _controller;
  late String? _selectedCardId;
  String? _error;
  String _method = 'mock';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: widget.quickAmounts.first.toStringAsFixed(0),
    );
    _selectedCardId = widget.selectedCardId ??
        (widget.cards.isEmpty ? null : widget.cards.first.id);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_isLoading) return;
    final amount = double.tryParse(_controller.text.replaceAll(',', '.'));
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Düzgün məbləğ daxil edin');
      return;
    }
    if (widget.maxAmount != null && amount > widget.maxAmount!) {
      setState(() => _error = 'Kifayət qədər vəsait yoxdur');
      return;
    }

    if (widget.requireCard && _method == 'mock' && _selectedCardId == null) {
      setState(() => _error = 'Kart seçin');
      return;
    }

    setState(() => _isLoading = true);
    try {
      if (mounted) {
        Navigator.of(context).pop(_WalletActionRequest(
            amount: amount, cardId: _selectedCardId, method: _method));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, bottomInset + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppTheme.navy,
                  ),
            ),
            const SizedBox(height: 16),
            if (widget.allowStripe) ...[
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'mock', label: Text('Demo Card')),
                  ButtonSegment(value: 'stripe', label: Text('Stripe')),
                ],
                selected: {_method},
                onSelectionChanged: (val) {
                  setState(() => _method = val.first);
                },
              ),
              const SizedBox(height: 16),
            ],
            if (_method == 'mock' && widget.requireCard) ...[
              Text(
                'Card',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.navy,
                    ),
              ),
              const SizedBox(height: 8),
              if (widget.cards.isEmpty)
                const Text(
                  'No card added',
                  style: TextStyle(color: AppTheme.slate500),
                )
              else
                ...widget.cards.map(
                  (card) => RadioListTile<String>(
                    contentPadding: EdgeInsets.zero,
                    value: card.id,
                    // ignore: deprecated_member_use
                    groupValue: _selectedCardId,
                    // ignore: deprecated_member_use
                    onChanged: (value) =>
                        setState(() => _selectedCardId = value),
                    title: Text(card.label),
                    subtitle: Text('${card.holderName} · ${card.expiry}'),
                  ),
                ),
              const SizedBox(height: 16),
            ],
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: widget.quickAmounts.map((amount) {
                return OutlinedButton(
                  onPressed: () {
                    _controller.text = amount.toStringAsFixed(0);
                    setState(() => _error = null);
                  },
                  child: Text('${amount.toStringAsFixed(0)} AZN'),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _controller,
              autofocus: true,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Amount',
                suffixText: 'AZN',
                errorText: _error,
              ),
              onSubmitted: (_) => _submit(),
            ),
            if (widget.maxAmount != null) ...[
              const SizedBox(height: 8),
              Text(
                'Available: ${widget.maxAmount!.toStringAsFixed(2)} AZN',
                style: const TextStyle(fontSize: 12, color: AppTheme.slate500),
              ),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_method == 'stripe'
                      ? 'Pay with Stripe'
                      : widget.actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodSection extends StatelessWidget {
  final List<WalletCard> cards;
  final WalletCard? selectedCard;
  final String emptyLabel;
  final String addLabel;
  final ValueChanged<String> onSelect;
  final VoidCallback onAdd;

  const _PaymentMethodSection({
    required this.cards,
    required this.selectedCard,
    required this.emptyLabel,
    required this.addLabel,
    required this.onSelect,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (cards.isEmpty)
          Row(
            children: [
              const Icon(Icons.credit_card, color: AppTheme.slate500),
              const SizedBox(width: 12),
              Expanded(child: Text(emptyLabel)),
            ],
          )
        else
          ...cards.map(
            (card) => RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              value: card.id,
              // ignore: deprecated_member_use
              groupValue: selectedCard?.id,
              // ignore: deprecated_member_use
              onChanged: (value) {
                if (value != null) onSelect(value);
              },
              title: Text(card.label),
              subtitle: Text('${card.holderName} · ${card.expiry}'),
              secondary: const Icon(
                Icons.credit_card,
                color: AppTheme.slate500,
              ),
            ),
          ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: onAdd,
          icon: const Icon(Icons.add_card),
          label: Text(addLabel),
        ),
      ],
    );
  }
}

class _AddCardSheet extends StatefulWidget {
  const _AddCardSheet();

  @override
  State<_AddCardSheet> createState() => _AddCardSheetState();
}

class _AddCardSheetState extends State<_AddCardSheet> {
  final _holder = TextEditingController();
  final _number = TextEditingController();
  final _expiry = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _holder.dispose();
    _number.dispose();
    _expiry.dispose();
    super.dispose();
  }

  void _submit() {
    final digits = _number.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 12 || _expiry.text.trim().length < 4) {
      setState(() => _error = 'Check card number and expiry');
      return;
    }
    Navigator.of(context).pop(
      _NewCardInput(
        holderName: _holder.text,
        number: _number.text,
        expiry: _expiry.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, bottomInset + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Add card',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppTheme.navy,
                  ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _number,
              autofocus: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Card number',
                hintText: '4242 4242 4242 4242',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _holder,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Card holder'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _expiry,
              keyboardType: TextInputType.datetime,
              decoration: const InputDecoration(
                labelText: 'Expiry',
                hintText: 'MM/YY',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Colors.red.shade600)),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submit,
              child: const Text('Add card'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final String label;
  final String description;
  final double amount;
  final String currency;
  final LinearGradient gradient;
  final String actionLabel;
  final IconData actionIcon;
  final VoidCallback? onAction;
  final String? secondaryActionLabel;
  final IconData? secondaryActionIcon;
  final VoidCallback? onSecondaryAction;

  const _BalanceCard({
    required this.label,
    required this.description,
    required this.amount,
    required this.currency,
    required this.gradient,
    required this.actionLabel,
    required this.actionIcon,
    this.onAction,
    this.secondaryActionLabel,
    this.secondaryActionIcon,
    this.onSecondaryAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppConstants.spacing20),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            description,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.6),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${amount.toStringAsFixed(2)} $currency',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onAction,
                  icon: Icon(actionIcon, size: 16),
                  label: Text(actionLabel),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    disabledForegroundColor: Colors.white,
                    disabledBackgroundColor:
                        Colors.white.withValues(alpha: 0.08),
                    side:
                        BorderSide(color: Colors.white.withValues(alpha: 0.5)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              if (secondaryActionLabel != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onSecondaryAction,
                    icon: Icon(secondaryActionIcon, size: 16),
                    label: Text(secondaryActionLabel!),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      disabledForegroundColor: Colors.white,
                      disabledBackgroundColor:
                          Colors.white.withValues(alpha: 0.08),
                      side: BorderSide(
                          color: Colors.white.withValues(alpha: 0.5)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _TxnRow extends StatelessWidget {
  final WalletTransaction transaction;

  const _TxnRow({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.isCredit;
    final label = transaction.description ?? transaction.type.label;
    final amount = transaction.amount;
    final currency = transaction.currency;
    final date = AppDateUtils.formatLocalDateTime(transaction.createdAt,
        format: 'dd MMM, HH:mm');

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
                Text(label,
                    style: const TextStyle(fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(
                  date,
                  style:
                      const TextStyle(fontSize: 12, color: AppTheme.slate500),
                ),
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
