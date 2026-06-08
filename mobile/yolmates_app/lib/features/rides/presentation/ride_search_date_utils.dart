DateTime rideDateOnly(DateTime value) {
  return DateTime(value.year, value.month, value.day);
}

DateTime rideSearchFirstDate({DateTime? now}) {
  return rideDateOnly(now ?? DateTime.now());
}

DateTime rideSearchInitialDate(DateTime? selected, {DateTime? now}) {
  final firstDate = rideSearchFirstDate(now: now);
  if (selected == null) {
    return firstDate;
  }

  final normalizedSelected = rideDateOnly(selected);
  if (normalizedSelected.isBefore(firstDate)) {
    return firstDate;
  }

  return normalizedSelected;
}

DateTime rideSearchLastDate({DateTime? now, int days = 180}) {
  return rideSearchFirstDate(now: now).add(Duration(days: days));
}
