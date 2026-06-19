import '../../../core/network/api_client.dart';
import 'wallet.dart';
import 'wallet_dto.dart';
import 'wallet_repository.dart';

/// API implementation of wallet repository.
class ApiWalletRepository implements WalletRepository {
  final ApiClient _client;

  ApiWalletRepository(this._client);

  @override
  Future<WalletBalance> getBalance() async {
    final response = await _client.get('/wallet/me');
    return WalletBalanceDTO.fromJson(response.data as Map<String, dynamic>)
        .toDomain();
  }

  @override
  Future<List<WalletTransaction>> getTransactions(
      {int page = 1, int limit = 20}) async {
    final response = await _client.get(
      '/wallet/me/transactions',
      queryParameters: {'page': page, 'limit': limit},
    );

    final List<dynamic> items = response.data['items'] ?? [];
    return items
        .map((json) =>
            WalletTransactionDTO.fromJson(json as Map<String, dynamic>)
                .toDomain())
        .toList();
  }

  @override
  Future<WalletBalance> topUpPassenger(double amount) async {
    await _client.post('/wallet/me/topup', data: {
      'amount': amount,
      'idempotency_key':
          'mobile-topup-${DateTime.now().microsecondsSinceEpoch}',
    });
    return getBalance();
  }

  @override
  Future<WalletBalance> withdrawDriver(double amount) async {
    await _client.post('/wallet/me/payouts', data: {
      'amount': amount,
      'idempotency_key':
          'mobile-payout-${DateTime.now().microsecondsSinceEpoch}',
    });
    return getBalance();
  }

  @override
  Future<WalletBalance> simulateDriverEarning(
      double amount, String description) async {
    // In API mode, backend handles wallet update during complete_ride
    return getBalance();
  }

  @override
  Future<Map<String, dynamic>> createStripeTopUp(double amount) async {
    final response = await _client.post(
      '/payments/stripe/wallet-top-up',
      data: {'amount': amount},
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> getStripeTopUpStatus(String sessionId) async {
    final response = await _client.get('/payments/stripe/session/$sessionId');
    return response.data as Map<String, dynamic>;
  }
}
