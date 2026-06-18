import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/session_storage.dart';
import '../../features/auth/state/auth_controller.dart';
import 'api_client.dart';
import 'api_config.dart';
import 'auth_token_storage.dart';

/// Global session storage provider.
///
/// Production uses secure keystore; tests inject in-memory.
final sessionStorageProvider = Provider<SessionStorage>(
  (ref) => SecureSessionStorage(),
);

/// Global token storage provider.
final authTokenStorageProvider = Provider<AuthTokenStorage>(
  (ref) => AuthTokenStorage(ref.watch(sessionStorageProvider)),
);

/// Global API client provider.
///
/// Configured with auth interceptors and error mapping.
/// Access via `ref.read(apiClientProvider)` or `ref.watch(apiClientProvider)`.
final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(
    ref.watch(authTokenStorageProvider),
    onUnauthenticated: () {
      ref.read(authControllerProvider.notifier).logout();
    },
  ),
);

/// Exposes configured base URL for display/debugging.
final apiBaseUrlProvider = Provider<String>(
  (ref) => ApiConfig.baseUrl,
);
