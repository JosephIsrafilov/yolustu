/// A ride published by the current user acting as a driver (mock).
enum DriverRideStatus { active, upcoming, completed, cancelled }

extension DriverRideStatusX on DriverRideStatus {
  String get label {
    switch (this) {
      case DriverRideStatus.active:
        return 'Aktiv';
      case DriverRideStatus.upcoming:
        return 'Yaxınlaşan';
      case DriverRideStatus.completed:
        return 'Tamamlandı';
      case DriverRideStatus.cancelled:
        return 'Ləğv edildi';
    }
  }
}

class DriverRide {
  final String id;
  final String fromCity;
  final String toCity;
  final DateTime departureTime;
  final int seats;
  final double pricePerSeat;
  final bool allowLuggage;
  final bool allowSmoking;
  final bool allowMusic;
  final String description;
  final DriverRideStatus status;

  const DriverRide({
    required this.id,
    required this.fromCity,
    required this.toCity,
    required this.departureTime,
    required this.seats,
    required this.pricePerSeat,
    this.allowLuggage = true,
    this.allowSmoking = false,
    this.allowMusic = true,
    this.description = '',
    this.status = DriverRideStatus.upcoming,
  });

  DriverRide copyWith({DriverRideStatus? status}) {
    return DriverRide(
      id: id,
      fromCity: fromCity,
      toCity: toCity,
      departureTime: departureTime,
      seats: seats,
      pricePerSeat: pricePerSeat,
      allowLuggage: allowLuggage,
      allowSmoking: allowSmoking,
      allowMusic: allowMusic,
      description: description,
      status: status ?? this.status,
    );
  }
}

/// A passenger booking request against the driver's rides (mock).
enum RequestStatus { pending, accepted, rejected }

extension RequestStatusX on RequestStatus {
  String get label {
    switch (this) {
      case RequestStatus.pending:
        return 'Gözləyir';
      case RequestStatus.accepted:
        return 'Qəbul edildi';
      case RequestStatus.rejected:
        return 'Rədd edildi';
    }
  }
}

class PassengerRequest {
  final String id;
  final String passengerName;
  final String fromCity;
  final String toCity;
  final DateTime departureTime;
  final int seats;
  final double rating;
  final RequestStatus status;

  const PassengerRequest({
    required this.id,
    required this.passengerName,
    required this.fromCity,
    required this.toCity,
    required this.departureTime,
    required this.seats,
    required this.rating,
    this.status = RequestStatus.pending,
  });

  PassengerRequest copyWith({RequestStatus? status}) {
    return PassengerRequest(
      id: id,
      passengerName: passengerName,
      fromCity: fromCity,
      toCity: toCity,
      departureTime: departureTime,
      seats: seats,
      rating: rating,
      status: status ?? this.status,
    );
  }
}
