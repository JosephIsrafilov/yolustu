import 'package:flutter/material.dart';
import '../../../core/theme.dart';

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

  /// Badge colors (background, foreground).
  (Color, Color) get colors {
    switch (this) {
      case DriverRideStatus.active:
        return (AppTheme.teal.withValues(alpha: 0.1), AppTheme.tealDark);
      case DriverRideStatus.upcoming:
        return (Colors.blue.shade50, Colors.blue.shade700);
      case DriverRideStatus.completed:
        return (AppTheme.slate100, AppTheme.slate700);
      case DriverRideStatus.cancelled:
        return (Colors.red.shade50, Colors.red.shade700);
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

  /// Badge colors (background, foreground).
  (Color, Color) get colors {
    switch (this) {
      case RequestStatus.pending:
        return (Colors.orange.shade50, Colors.orange.shade700);
      case RequestStatus.accepted:
        return (AppTheme.teal.withValues(alpha: 0.1), AppTheme.tealDark);
      case RequestStatus.rejected:
        return (Colors.red.shade50, Colors.red.shade700);
    }
  }
}

class PassengerRequest {
  final String id;
  final String rideId;
  final String passengerName;
  final String fromCity;
  final String toCity;
  final DateTime departureTime;
  final int seats;
  final double rating;
  final RequestStatus status;

  const PassengerRequest({
    required this.id,
    this.rideId = '',
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
      rideId: rideId,
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
