import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/rides/domain/ride_search_filters.dart';

void main() {
  test('ride search filters keep route, seats, and departure date', () {
    final filters = RideSearchFilters(
      fromCity: 'Bakı',
      toCity: 'Gəncə',
      seats: 2,
      date: DateTime(2026, 6, 5),
    );

    expect(filters.toQueryParameters(), <String, dynamic>{
      'origin_city': 'Bakı',
      'dest_city': 'Gəncə',
      'min_seats': 2,
      'departure_date': '2026-06-05',
    });
  });
}
