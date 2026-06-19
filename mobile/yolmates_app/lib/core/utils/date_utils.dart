import 'package:intl/intl.dart';

class AppDateUtils {
  /// Converts a UTC DateTime to the device's local timezone and formats it.
  /// Used for unified display across the app.
  static String formatLocalDateTime(DateTime utcDate,
      {String format = 'dd MMM yyyy, HH:mm'}) {
    // Make sure the DateTime is treated as UTC if it doesn't already have the isUtc flag.
    final dt = utcDate.isUtc
        ? utcDate
        : DateTime.utc(
            utcDate.year,
            utcDate.month,
            utcDate.day,
            utcDate.hour,
            utcDate.minute,
            utcDate.second,
            utcDate.millisecond,
            utcDate.microsecond);

    // Convert to local time
    final localDate = dt.toLocal();

    return DateFormat(format).format(localDate);
  }

  /// Format a DateTime that is already in local time.
  static String formatLocal(DateTime localDate,
      {String format = 'dd MMM yyyy, HH:mm'}) {
    return DateFormat(format).format(localDate);
  }
}
