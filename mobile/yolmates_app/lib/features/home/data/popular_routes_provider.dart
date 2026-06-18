import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'popular_route.dart';
import 'popular_routes_repository.dart';

final popularRoutesRepositoryProvider =
    Provider<PopularRoutesRepository>((ref) {
  if (AuthMode.isApi) {
    return ApiPopularRoutesRepository(ref.read(apiClientProvider));
  }
  return MockPopularRoutesRepository();
});

final popularRoutesProvider = FutureProvider<List<PopularRoute>>((ref) async {
  final repository = ref.watch(popularRoutesRepositoryProvider);
  return repository.getPopularRoutes();
});
