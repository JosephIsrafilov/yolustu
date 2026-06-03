class RideSearchFilters {
  const RideSearchFilters({
    this.fromCity,
    this.toCity,
    this.seats,
    this.date,
  });

  final String? fromCity;
  final String? toCity;
  final int? seats;
  final DateTime? date;

  Map<String, dynamic> toQueryParameters() {
    return <String, dynamic>{
      if (fromCity != null && fromCity!.isNotEmpty) 'origin_city': fromCity,
      if (toCity != null && toCity!.isNotEmpty) 'dest_city': toCity,
      if (seats != null) 'min_seats': seats,
      if (date != null) 'departure_date': date!.toIso8601String().split('T').first,
    };
  }
}
