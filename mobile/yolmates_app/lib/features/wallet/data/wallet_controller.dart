import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'wallet.dart';
import 'wallet_repository.dart';

/// Wallet state combining balance and recent transactions.
class WalletState {
  final WalletBalance balance;
  final List<WalletTransaction> transactions;

  const WalletState({
    required this.balance,
    required this.transactions,
  });

  WalletState copyWith({
    WalletBalance? balance,
    List<WalletTransaction>? transactions,
  }) {
    return WalletState(
      balance: balance ?? this.balance,
      transactions: transactions ?? this.transactions,
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
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final results = await Future.wait([
        _repo.getBalance(),
        _repo.getTransactions(limit: 20),
      ]);

      return WalletState(
        balance: results[0] as WalletBalance,
        transactions: results[1] as List<WalletTransaction>,
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
}

final walletControllerProvider = AsyncNotifierProvider<WalletController, WalletState>(
  WalletController.new,
);
