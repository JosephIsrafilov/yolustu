import 'ride.dart';

enum BookingStatus {
  pending,
  accepted,
  paid,
  rejected,
  cancelled,
  completed,
}

class Booking {
  const Booking({
    required this.id,
    required this.rideId,
    required this.passengerId,
    required this.ride,
    required this.status,
    required this.seats,
    required this.totalPrice,
    required this.createdAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    final ride = Ride.fromJson(
      (json['ride'] as Map<String, dynamic>?) ?? <String, dynamic>{},
    );
    final seats = (json['seats_booked'] ?? json['seats'] ?? 1) as int;
    return Booking(
      id: (json['id'] as String?) ?? '',
      rideId: (json['ride_id'] as String?) ?? '',
      passengerId: (json['passenger_id'] as String?) ?? '',
      ride: ride,
      status: _statusFromJson((json['status'] as String?) ?? 'pending'),
      seats: seats,
      totalPrice:
          (json['total_price'] as num?)?.toDouble() ?? (ride.priceAzn * seats),
      createdAt: DateTime.parse(
        (json['created_at'] ??
                json['createdAt'] ??
                DateTime.now().toIso8601String())
            as String,
      ),
    );
  }

  final String id;
  final String rideId;
  final String passengerId;
  final Ride ride;
  final BookingStatus status;
  final int seats;
  final double totalPrice;
  final DateTime createdAt;
  bool get canCancel =>
      status == BookingStatus.pending ||
      status == BookingStatus.accepted ||
      status == BookingStatus.paid;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'ride_id': rideId,
      'passenger_id': passengerId,
      'ride': ride.toJson(),
      'status': status.name,
      'seats_booked': seats,
      'total_price': totalPrice,
      'created_at': createdAt.toIso8601String(),
    };
  }

  static BookingStatus _statusFromJson(String value) {
    return BookingStatus.values.firstWhere(
      (BookingStatus item) => item.name == value,
      orElse: () => BookingStatus.pending,
    );
  }
}
