/// Recent search entry for quick re-search.
class RecentSearch {
  final String fromCity;
  final String toCity;
  final DateTime searchedAt;

  const RecentSearch({
    required this.fromCity,
    required this.toCity,
    required this.searchedAt,
  });

  Map<String, dynamic> toJson() => {
        'fromCity': fromCity,
        'toCity': toCity,
        'searchedAt': searchedAt.toIso8601String(),
      };

  factory RecentSearch.fromJson(Map<String, dynamic> json) => RecentSearch(
        fromCity: json['fromCity'] as String,
        toCity: json['toCity'] as String,
        searchedAt: DateTime.parse(json['searchedAt'] as String),
      );
}
