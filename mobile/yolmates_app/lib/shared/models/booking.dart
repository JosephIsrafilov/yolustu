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
    required this.ride,
    required this.status,
    required this.seats,
    required this.createdAt,
  });

  final String id;
  final Ride ride;
  final BookingStatus status;
  final int seats;
  final DateTime createdAt;

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: (json['id'] as String?) ?? '',
      ride: Ride.fromJson(
        (json['ride'] as Map<String, dynamic>?) ?? <String, dynamic>{},
      ),
      status: _statusFromJson((json['status'] as String?) ?? 'pending'),
      seats: (json['seats_booked'] ?? json['seats'] ?? 1) as int,
      createdAt: DateTime.parse(
        (json['created_at'] ??
                json['createdAt'] ??
                DateTime.now().toIso8601String())
            as String,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'ride': ride.toJson(),
      'status': status.name,
      'seats_booked': seats,
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
