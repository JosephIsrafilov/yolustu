import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/rides/presentation/ride_search_date_utils.dart';

void main() {
  test('ride search initial date clamps past values to first date', () {
    final now = DateTime(2026, 6, 9, 15, 30);
    final firstDate = rideSearchFirstDate(now: now);
    final initialDate = rideSearchInitialDate(
      DateTime(2026, 6, 5, 8, 0),
      now: now,
    );

    expect(firstDate, DateTime(2026, 6, 9));
    expect(initialDate, firstDate);
  });

  test('ride search last date stays after first date', () {
    final now = DateTime(2026, 6, 9, 15, 30);

    expect(
      rideSearchLastDate(now: now),
      DateTime(2026, 12, 6),
    );
  });
}
