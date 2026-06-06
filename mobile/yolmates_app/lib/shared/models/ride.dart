import 'user.dart';

enum RideStatus { active, cancelled, completed }

class Ride {
  const Ride({
    required this.id,
    required this.driver,
    required this.fromCity,
    required this.toCity,
    required this.departureTime,
    required this.priceAzn,
    required this.availableSeats,
    required this.totalSeats,
    required this.meetingPoint,
    required this.dropoffPoint,
    required this.description,
    this.status = RideStatus.active,
  });

  factory Ride.fromJson(Map<String, dynamic> json) {
    final driverJson =
        json['driver'] as Map<String, dynamic>? ??
        <String, dynamic>{
          'id': json['driver_id'] ?? '',
          'full_name': 'Driver',
          'phone': '',
          'city': json['origin_city'] ?? '',
          'rating': 0,
          'completed_trips': 0,
          'verification_status': 'none',
          'role': 'driver',
        };
    final priceValue = json['price_per_seat'] ?? json['priceAzn'] ?? 0;

    return Ride(
      id: (json['id'] as String?) ?? '',
      driver: User.fromJson(driverJson),
      fromCity: (json['origin_city'] ?? json['fromCity'] ?? '') as String,
      toCity: (json['destination_city'] ?? json['toCity'] ?? '') as String,
      departureTime: DateTime.parse(
        (json['departure_time'] ??
                json['departureTime'] ??
                DateTime.now().toIso8601String())
            as String,
      ),
      priceAzn: (priceValue as num).toDouble(),
      availableSeats:
          (json['available_seats'] ?? json['availableSeats']) as int? ?? 0,
      totalSeats: (json['total_seats'] ?? json['totalSeats']) as int? ?? 0,
      meetingPoint:
          (json['meeting_point'] ?? json['meetingPoint'] ?? '') as String,
      dropoffPoint:
          (json['dropoff_point'] ?? json['dropoffPoint'] ?? '') as String,
      description: (json['description'] as String?) ?? '',
      status: _rideStatusFromJson((json['status'] as String?) ?? 'active'),
    );
  }

  final String id;
  final User driver;
  final String fromCity;
  final String toCity;
  final DateTime departureTime;
  final double priceAzn;
  final int availableSeats;
  final int totalSeats;
  final String meetingPoint;
  final String dropoffPoint;
  final String description;
  final RideStatus status;
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'driver': driver.toJson(),
      'origin_city': fromCity,
      'destination_city': toCity,
      'departure_time': departureTime.toIso8601String(),
      'price_per_seat': priceAzn,
      'available_seats': availableSeats,
      'total_seats': totalSeats,
      'meeting_point': meetingPoint,
      'dropoff_point': dropoffPoint,
      'description': description,
      'status': status.name,
    };
  }

  static RideStatus _rideStatusFromJson(String value) {
    return RideStatus.values.firstWhere(
      (RideStatus item) => item.name == value,
      orElse: () => RideStatus.active,
    );
  }
}
