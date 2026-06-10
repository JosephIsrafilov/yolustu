import 'user.dart';

class Trip {
  final String id;
  final User driver;
  final String fromCity;
  final String toCity;
  final DateTime departureTime;
  final double price;
  final int availableSeats;
  final int totalSeats;
  final String status;

  const Trip({
    required this.id,
    required this.driver,
    required this.fromCity,
    required this.toCity,
    required this.departureTime,
    required this.price,
    required this.availableSeats,
    required this.totalSeats,
    required this.status,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'] as String,
      driver: User.fromJson(json['driver'] as Map<String, dynamic>),
      fromCity: json['from_city'] as String,
      toCity: json['to_city'] as String,
      departureTime: DateTime.parse(json['departure_time'] as String),
      price: (json['price'] as num).toDouble(),
      availableSeats: json['available_seats'] as int,
      totalSeats: json['total_seats'] as int,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'driver': driver.toJson(),
      'from_city': fromCity,
      'to_city': toCity,
      'departure_time': departureTime.toIso8601String(),
      'price': price,
      'available_seats': availableSeats,
      'total_seats': totalSeats,
      'status': status,
    };
  }
}
