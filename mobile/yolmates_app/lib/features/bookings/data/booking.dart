/// Booking domain model (mock).
///
/// Backend integration maps its booking DTO onto this shape.
enum BookingStatus {
  pending,
  confirmed,
  rejected,
  cancelled,
  paid,
  completed,
}

extension BookingStatusX on BookingStatus {
  /// Azerbaijani label for status badges.
  String get label {
    switch (this) {
      case BookingStatus.pending:
        return 'Gözləyir';
      case BookingStatus.confirmed:
        return 'Təsdiqləndi';
      case BookingStatus.rejected:
        return 'Rədd edildi';
      case BookingStatus.cancelled:
        return 'Ləğv edildi';
      case BookingStatus.paid:
        return 'Ödənildi';
      case BookingStatus.completed:
        return 'Tamamlandı';
    }
  }

  bool get isActive =>
      this == BookingStatus.pending ||
      this == BookingStatus.confirmed ||
      this == BookingStatus.paid;

  /// Confirmed-but-unpaid bookings expose a payment action.
  bool get needsPayment => this == BookingStatus.confirmed;
}

class Booking {
  final String id;
  final String rideId;
  final String driverId;
  final String fromCity;
  final String toCity;
  final String driverName;
  final DateTime departureTime;
  final int seats;
  final double pricePerSeat;
  final BookingStatus status;
  final DateTime createdAt;

  const Booking({
    required this.id,
    required this.rideId,
    this.driverId = 'mock-driver-id',
    required this.fromCity,
    required this.toCity,
    required this.driverName,
    required this.departureTime,
    required this.seats,
    required this.pricePerSeat,
    required this.status,
    required this.createdAt,
  });

  double get total => pricePerSeat * seats;

  Booking copyWith({BookingStatus? status}) {
    return Booking(
      id: id,
      rideId: rideId,
      driverId: driverId,
      fromCity: fromCity,
      toCity: toCity,
      driverName: driverName,
      departureTime: departureTime,
      seats: seats,
      pricePerSeat: pricePerSeat,
      status: status ?? this.status,
      createdAt: createdAt,
    );
  }
}
