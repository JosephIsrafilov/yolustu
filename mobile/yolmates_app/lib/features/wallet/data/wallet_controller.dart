import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'wallet.dart';
import 'wallet_repository.dart';

/// Wallet state combining balance and recent transactions.
class WalletState {
  final WalletBalance balance;
  final List<WalletTransaction> transactions;
  final List<WalletCard> cards;
  final String? selectedCardId;

  const WalletState({
    required this.balance,
    required this.transactions,
    this.cards = const [],
    this.selectedCardId,
  });

  WalletCard? get selectedCard {
    for (final card in cards) {
      if (card.id == selectedCardId) return card;
    }
    return cards.isEmpty ? null : cards.first;
  }

  WalletState copyWith({
    WalletBalance? balance,
    List<WalletTransaction>? transactions,
    List<WalletCard>? cards,
    String? selectedCardId,
  }) {
    return WalletState(
      balance: balance ?? this.balance,
      transactions: transactions ?? this.transactions,
      cards: cards ?? this.cards,
      selectedCardId: selectedCardId ?? this.selectedCardId,
    );
  }
}

/// Controller for wallet balance and transactions.
class WalletController extends AsyncNotifier<WalletState> {
  WalletRepository get _repo => ref.read(walletRepositoryProvider);

  @override
  Future<WalletState> build() async {
    final results = await Future.wait([
      _repo.getBalance(),
      _repo.getTransactions(limit: 20),
    ]);

    return WalletState(
      balance: results[0] as WalletBalance,
      transactions: results[1] as List<WalletTransaction>,
      cards: _demoCards,
      selectedCardId: _demoCards.first.id,
    );
  }

  Future<void> refresh() async {
    final current = state.value;
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final results = await Future.wait([
        _repo.getBalance(),
        _repo.getTransactions(limit: 20),
      ]);

      return WalletState(
        balance: results[0] as WalletBalance,
        transactions: results[1] as List<WalletTransaction>,
        cards: current?.cards ?? _demoCards,
        selectedCardId: current?.selectedCardId ?? _demoCards.first.id,
      );
    });
  }

  Future<void> loadMoreTransactions() async {
    final current = state.value;
    if (current == null) return;

    final page = (current.transactions.length ~/ 20) + 1;
    final newTransactions = await _repo.getTransactions(page: page, limit: 20);

    state = AsyncValue.data(
      current.copyWith(
        transactions: [...current.transactions, ...newTransactions],
      ),
    );
  }

  Future<void> topUpPassenger(double amount) async {
    final current = state.value;
    state = const AsyncValue.loading();
    try {
      final balance = await _repo.topUpPassenger(amount);
      final transactions = await _repo.getTransactions(limit: 20);
      state = AsyncValue.data(WalletState(
        balance: balance,
        transactions: transactions,
      ));
    } catch (e) {
      if (current != null) {
        state = AsyncValue.data(current);
      }
      throw Exception(e.toString());
    }
  }

  Future<void> withdrawDriver(double amount) async {
    final current = state.value;
    state = const AsyncValue.loading();
    try {
      final balance = await _repo.withdrawDriver(amount);
      final transactions = await _repo.getTransactions(limit: 20);
      state = AsyncValue.data(WalletState(
        balance: balance,
        transactions: transactions,
      ));
    } catch (e) {
      if (current != null) {
        state = AsyncValue.data(current);
      }
      throw Exception(e.toString());
    }
  }
}

final walletControllerProvider =
    AsyncNotifierProvider<WalletController, WalletState>(
  WalletController.new,
);

const _demoCards = [
  WalletCard(
    id: 'demo-card-1',
    holderName: 'Demo User',
    last4: '4242',
    expiry: '12/29',
    brand: 'Visa',
  ),
];

String _detectBrand(String digits) {
  if (digits.startsWith('4')) return 'Visa';
  if (digits.startsWith('5') || digits.startsWith('2')) return 'Mastercard';
  return 'Card';
}
