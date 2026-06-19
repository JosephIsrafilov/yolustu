import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/core/utils/date_utils.dart';

void main() {
  test('formatLocalDateTime converts UTC values before formatting', () {
    final utc = DateTime.utc(2026, 6, 19, 12, 30);
    final expectedLocal = utc.toLocal();

    expect(
      AppDateUtils.formatLocalDateTime(utc, format: 'yyyy-MM-dd HH:mm'),
      '${expectedLocal.year.toString().padLeft(4, '0')}-'
      '${expectedLocal.month.toString().padLeft(2, '0')}-'
      '${expectedLocal.day.toString().padLeft(2, '0')} '
      '${expectedLocal.hour.toString().padLeft(2, '0')}:'
      '${expectedLocal.minute.toString().padLeft(2, '0')}',
    );
  });
}
