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
    return WalletBalanceDTO.fromJson(response.data as Map<String, dynamic>).toDomain();
  }

  @override
  Future<List<WalletTransaction>> getTransactions({int page = 1, int limit = 20}) async {
    final response = await _client.get(
      '/wallet/me/transactions',
      queryParameters: {'page': page, 'limit': limit},
    );

    final List<dynamic> items = response.data['items'] ?? [];
    return items
        .map((json) => WalletTransactionDTO.fromJson(json as Map<String, dynamic>).toDomain())
        .toList();
  }
}
