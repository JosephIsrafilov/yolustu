import 'package:intl/intl.dart';

String formatAzn(num amount) {
  final formatter = NumberFormat.currency(
    locale: 'az',
    symbol: 'AZN ',
    decimalDigits: 0,
  );
  return formatter.format(amount);
}

String formatDeparture(DateTime dateTime) {
  final formatter = DateFormat('d MMM, HH:mm', 'az');
  return formatter.format(dateTime);
}
