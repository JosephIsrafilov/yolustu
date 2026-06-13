import '../../../shared/data/ride_dto.dart';

/// Backend BookingResponse DTO.
///
/// Backend shape from `app/domains/bookings/schemas.py`:
/// - id: UUID
/// - ride_id: UUID
/// - passenger_id: UUID
/// - seats_booked: int
/// - status: str
/// - total_price: Decimal
/// - payment_deadline: Optional[datetime]
/// - created_at: datetime
/// - ride: Optional[RideResponse]
/// - passenger: Optional[UserResponse]
class BookingDto {
  final String id;
  final String rideId;
  final String passengerId;
  final int seatsBooked;
  final String status;
  final double totalPrice;
  final DateTime? paymentDeadline;
  final DateTime createdAt;
  final RideDto? ride;
  final DriverDto? passenger;

  const BookingDto({
    required this.id,
    required this.rideId,
    required this.passengerId,
    required this.seatsBooked,
    required this.status,
    required this.totalPrice,
    this.paymentDeadline,
    required this.createdAt,
    this.ride,
    this.passenger,
  });

  factory BookingDto.fromJson(Map<String, dynamic> json) {
    return BookingDto(
      id: json['id'].toString(),
      rideId: json['ride_id'].toString(),
      passengerId: json['passenger_id'].toString(),
      seatsBooked: json['seats_booked'] as int,
      status: json['status'] as String,
      totalPrice: _parseDecimal(json['total_price']),
      paymentDeadline: json['payment_deadline'] != null
          ? DateTime.parse(json['payment_deadline'])
          : null,
      createdAt: DateTime.parse(json['created_at']),
      ride: json['ride'] != null
          ? RideDto.fromJson(json['ride'] as Map<String, dynamic>)
          : null,
      passenger: json['passenger'] != null
          ? DriverDto.fromJson(json['passenger'] as Map<String, dynamic>)
          : null,
    );
  }

  static double _parseDecimal(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.parse(value);
    return 0.0;
  }
}
