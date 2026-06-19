import 'package:flutter_test/flutter_test.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:yolmates_app/core/network/api_client.dart';
import 'package:yolmates_app/core/network/api_exception.dart';
import 'package:yolmates_app/core/network/auth_token_storage.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/wallet/data/api_wallet_repository.dart';

void main() {
  late ApiWalletRepository repository;
  late DioAdapter adapter;

  setUp(() {
    final client = ApiClient(
      AuthTokenStorage(InMemorySessionStorage()),
    );
    adapter = DioAdapter(dio: client.dio);
    repository = ApiWalletRepository(client);
  });

  test('createStripeTopUp uses the wallet top-up endpoint', () async {
    adapter.onPost(
      'payments/stripe/wallet-top-up',
      (server) => server.reply(200, {
        'checkout_url': 'https://checkout.stripe.test/session',
        'session_id': 'cs_test_123',
        'payment_id': null,
      }),
      data: {'amount': 25.0},
    );

    final response = await repository.createStripeTopUp(25);

    expect(response['checkout_url'], 'https://checkout.stripe.test/session');
    expect(response['session_id'], 'cs_test_123');
  });

  test('Stripe Not Found is normalized as ApiException 404', () async {
    adapter.onPost(
      'payments/stripe/wallet-top-up',
      (server) => server.reply(404, {'detail': 'Not Found'}),
      data: {'amount': 25.0},
    );

    expect(
      () => repository.createStripeTopUp(25),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 404),
      ),
    );
  });
}
