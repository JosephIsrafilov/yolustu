import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'popular_route.dart';
import 'popular_routes_repository.dart';

/// Provider for popular routes repository.
final popularRoutesRepositoryProvider = Provider<PopularRoutesRepository>((ref) {
  return MockPopularRoutesRepository();
});

/// Provider for popular routes data.
final popularRoutesProvider = FutureProvider<List<PopularRoute>>((ref) async {
  final repository = ref.watch(popularRoutesRepositoryProvider);
  return repository.getPopularRoutes();
});
