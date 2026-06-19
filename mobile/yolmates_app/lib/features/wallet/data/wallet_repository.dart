import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'api_wallet_repository.dart';
import 'wallet.dart';

/// Wallet repository contract. Backend swap point.
abstract class WalletRepository {
  Future<WalletBalance> getBalance();
  Future<List<WalletTransaction>> getTransactions(
      {int page = 1, int limit = 20});
  Future<WalletBalance> topUpPassenger(double amount);
  Future<WalletBalance> withdrawDriver(double amount);
  Future<WalletBalance> simulateDriverEarning(
      double amount, String description);
  Future<Map<String, dynamic>> createStripeTopUp(double amount);
  Future<Map<String, dynamic>> getStripeTopUpStatus(String sessionId);
}

/// Mock wallet repository with realistic demo data.
class MockWalletRepository implements WalletRepository {
  static const Duration _latency = Duration(milliseconds: 400);
  WalletBalance _balance = const WalletBalance(
    userId: 'mock-user',
    passengerBalance: 25.00,
    driverBalance: 75.50,
    pendingBalance: 0.00,
    currency: 'AZN',
    totalEarned: 75.50,
    totalSpent: 25.00,
  );
  late final List<WalletTransaction> _transactions = _initialTransactions();

  @override
  Future<WalletBalance> getBalance() async {
    await Future.delayed(_latency);
    return _balance;
  }

  @override
  Future<List<WalletTransaction>> getTransactions(
      {int page = 1, int limit = 20}) async {
    await Future.delayed(_latency);
    final start = (page - 1) * limit;
    return _transactions.skip(start).take(limit).toList();
  }

  @override
  Future<WalletBalance> topUpPassenger(double amount) async {
    await Future.delayed(_latency);
    if (amount <= 0) {
      throw ArgumentError.value(
          amount, 'amount', 'Amount must be greater than 0');
    }
    final nextPassengerBalance = _balance.passengerBalance + amount;
    _balance = _balance.copyWith(passengerBalance: nextPassengerBalance);
    _transactions.insert(
      0,
      WalletTransaction(
        id: 'mock-topup-${DateTime.now().microsecondsSinceEpoch}',
        userId: _balance.userId,
        type: WalletTransactionType.topUp,
        amount: amount,
        currency: _balance.currency,
        balanceAfter: nextPassengerBalance,
        description: 'Mock top up',
        createdAt: DateTime.now(),
      ),
    );
    return _balance;
  }

  @override
  Future<WalletBalance> withdrawDriver(double amount) async {
    await Future.delayed(_latency);
    if (amount <= 0) {
      throw ArgumentError.value(
          amount, 'amount', 'Amount must be greater than 0');
    }
    if (amount > _balance.driverBalance) {
      throw StateError('Insufficient driver balance');
    }
    final nextDriverBalance = _balance.driverBalance - amount;
    _balance = _balance.copyWith(driverBalance: nextDriverBalance);
    _transactions.insert(
      0,
      WalletTransaction(
        id: 'mock-withdraw-${DateTime.now().microsecondsSinceEpoch}',
        userId: _balance.userId,
        type: WalletTransactionType.payout,
        amount: -amount,
        currency: _balance.currency,
        balanceAfter: nextDriverBalance,
        description: 'Mock withdrawal',
        createdAt: DateTime.now(),
      ),
    );
    return _balance;
  }

  @override
  Future<WalletBalance> simulateDriverEarning(
      double amount, String description) async {
    await Future.delayed(_latency);
    final nextDriverBalance = _balance.driverBalance + amount;
    _balance = _balance.copyWith(
      driverBalance: nextDriverBalance,
      totalEarned: _balance.totalEarned + amount,
    );
    _transactions.insert(
      0,
      WalletTransaction(
        id: 'mock-earning-${DateTime.now().microsecondsSinceEpoch}',
        userId: _balance.userId,
        type: WalletTransactionType.driverAvailableEarning,
        amount: amount,
        currency: _balance.currency,
        balanceAfter: nextDriverBalance,
        description: description,
        createdAt: DateTime.now(),
      ),
    );
    return _balance;
  }

  @override
  Future<Map<String, dynamic>> createStripeTopUp(double amount) async {
    await Future.delayed(_latency);
    return {
      'checkout_url': 'https://stripe.com/mock',
      'session_id': 'mock_session_${DateTime.now().microsecondsSinceEpoch}',
    };
  }

  @override
  Future<Map<String, dynamic>> getStripeTopUpStatus(String sessionId) async {
    await Future.delayed(_latency);
    return {
      'session_id': sessionId,
      'status': 'completed',
      'amount': 50.0,
      'currency': 'USD',
      'wallet_balance': _balance.passengerBalance,
    };
  }

  List<WalletTransaction> _initialTransactions() {
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
