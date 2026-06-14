import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'api_wallet_repository.dart';
import 'wallet.dart';

/// Wallet repository contract. Backend swap point.
abstract class WalletRepository {
  Future<WalletBalance> getBalance();
  Future<List<WalletTransaction>> getTransactions({int page = 1, int limit = 20});
}

/// Mock wallet repository with realistic demo data.
class MockWalletRepository implements WalletRepository {
  static const Duration _latency = Duration(milliseconds: 400);

  @override
  Future<WalletBalance> getBalance() async {
    await Future.delayed(_latency);
    return const WalletBalance(
      userId: 'mock-user',
      availableBalance: 25.00,
      pendingBalance: 0.00,
      currency: 'AZN',
      totalEarned: 0.00,
      totalSpent: 25.00,
    );
  }

  @override
  Future<List<WalletTransaction>> getTransactions({int page = 1, int limit = 20}) async {
    await Future.delayed(_latency);

    final now = DateTime.now();
    return [
      WalletTransaction(
        id: 'txn-3',
        userId: 'mock-user',
        type: WalletTransactionType.passengerPayment,
        amount: -10.00,
        currency: 'AZN',
        balanceAfter: 25.00,
        description: 'Bakı → Quba',
        createdAt: now.subtract(const Duration(hours: 2)),
      ),
      WalletTransaction(
        id: 'txn-2',
        userId: 'mock-user',
        type: WalletTransactionType.refund,
        amount: 50.00,
        currency: 'AZN',
        balanceAfter: 35.00,
        description: 'Balans artımı',
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      WalletTransaction(
        id: 'txn-1',
        userId: 'mock-user',
        type: WalletTransactionType.passengerPayment,
        amount: -15.00,
        currency: 'AZN',
        balanceAfter: -15.00,
        description: 'Bakı → Gəncə',
        createdAt: now.subtract(const Duration(days: 2)),
      ),
    ];
  }
}

// --- Providers ---------------------------------------------------------------

/// Binds to real API or mock based on --dart-define=API_MODE.
final walletRepositoryProvider = Provider<WalletRepository>(
  (ref) {
    if (AuthMode.isApi) {
      return ApiWalletRepository(ref.read(apiClientProvider));
    } else {
      return MockWalletRepository();
    }
  },
);
