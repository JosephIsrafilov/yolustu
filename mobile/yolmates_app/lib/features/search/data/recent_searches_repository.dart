import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/session_storage.dart';
import 'recent_search.dart';

/// Repository for persisting recent searches.
class RecentSearchesRepository {
  static const _key = 'recent_searches';
  static const _maxRecent = 5;

  final SessionStorage _storage;

  RecentSearchesRepository(this._storage);

  Future<List<RecentSearch>> getRecentSearches() async {
    final json = await _storage.read(_key);
    if (json == null) return [];

    try {
      final List<dynamic> list = jsonDecode(json);
      return list.map((e) => RecentSearch.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> addSearch(String fromCity, String toCity) async {
    final searches = await getRecentSearches();

    // Remove duplicate route if exists
    searches.removeWhere((s) => s.fromCity == fromCity && s.toCity == toCity);

    // Add new search at front
    searches.insert(0, RecentSearch(
      fromCity: fromCity,
      toCity: toCity,
      searchedAt: DateTime.now(),
    ));

    // Keep only last 5
    final limited = searches.take(_maxRecent).toList();

    await _storage.write(_key, jsonEncode(limited.map((s) => s.toJson()).toList()));
  }

  Future<void> clearAll() async {
    await _storage.delete(_key);
  }
}

final recentSearchesRepositoryProvider = Provider<RecentSearchesRepository>((ref) {
  final storage = ref.watch(sessionStorageProvider);
  return RecentSearchesRepository(storage);
});

final recentSearchesProvider = FutureProvider<List<RecentSearch>>((ref) async {
  final repo = ref.watch(recentSearchesRepositoryProvider);
  return repo.getRecentSearches();
});
