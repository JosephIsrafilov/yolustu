import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/auth/data/session_storage.dart';
import 'package:yolmates_app/features/search/data/recent_searches_repository.dart';

void main() {
  group('RecentSearchesRepository', () {
    test('deduplicates routes and keeps only the last five', () async {
      final storage = InMemorySessionStorage();
      final repo = RecentSearchesRepository(storage);

      await repo.addSearch('Baku', 'Ganja');
      await repo.addSearch('Baku', 'Quba');
      await repo.addSearch('Baku', 'Shaki');
      await repo.addSearch('Baku', 'Lankaran');
      await repo.addSearch('Baku', 'Nakhchivan');
      await repo.addSearch('Baku', 'Quba');

      final searches = await repo.getRecentSearches();

      expect(searches, hasLength(5));
      expect(searches.first.fromCity, 'Baku');
      expect(searches.first.toCity, 'Quba');
      expect(
        searches.where(
            (search) => search.fromCity == 'Baku' && search.toCity == 'Quba'),
        hasLength(1),
      );
    });

    test('invalid storage payload falls back to an empty list', () async {
      final storage = InMemorySessionStorage();
      await storage.write('recent_searches', 'not-json');
      final repo = RecentSearchesRepository(storage);

      expect(await repo.getRecentSearches(), isEmpty);

      await repo.clearAll();
      expect(await repo.getRecentSearches(), isEmpty);
    });
  });
}
