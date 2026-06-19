import 'package:flutter/material.dart';
import '../../../core/theme.dart';

/// Booking domain model (mock).
///
/// Backend integration maps its booking DTO onto this shape.
enum BookingStatus {
  pending,
  confirmed,
  rejected,
  cancelled,
  paid,
  boarded,
  noShow,
  completed,
  expired,
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
      case BookingStatus.boarded:
        return 'Mindiyi təsdiqləndi';
      case BookingStatus.noShow:
        return 'Gəlmədi';
      case BookingStatus.completed:
        return 'Tamamlandı';
      case BookingStatus.expired:
        return 'Vaxtı bitdi';
    }
  }

  /// Badge colors (background, foreground).
  (Color, Color) get colors {
    switch (this) {
      case BookingStatus.pending:
        return (Colors.orange.shade50, Colors.orange.shade700);
      case BookingStatus.confirmed:
        return (AppTheme.teal.withValues(alpha: 0.1), AppTheme.tealDark);
      case BookingStatus.paid:
        return (Colors.green.shade50, Colors.green.shade700);
      case BookingStatus.boarded:
        return (Colors.blue.shade50, Colors.blue.shade700);
      case BookingStatus.completed:
        return (AppTheme.slate100, AppTheme.slate700);
      case BookingStatus.noShow:
      case BookingStatus.expired:
        return (Colors.red.shade50, Colors.red.shade700);
      case BookingStatus.rejected:
        return (Colors.red.shade50, Colors.red.shade700);
      case BookingStatus.cancelled:
        return (Colors.red.shade50, Colors.red.shade700);
    }
  }

  bool get isActive =>
      this == BookingStatus.pending ||
      this == BookingStatus.confirmed ||
      this == BookingStatus.paid ||
      this == BookingStatus.boarded;

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
  final List<String> selectedSpots;
  final double pricePerSeat;
  final double? totalPrice;
  final BookingStatus status;
  final DateTime createdAt;

  const Booking({
    required this.id,
    required this.rideId,
    this.driverId = '',
    required this.fromCity,
    required this.toCity,
    required this.driverName,
    required this.departureTime,
    required this.seats,
    this.selectedSpots = const [],
    required this.pricePerSeat,
    this.totalPrice,
    required this.status,
    required this.createdAt,
  });

  double get total => totalPrice ?? pricePerSeat * seats;

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
      selectedSpots: selectedSpots,
      pricePerSeat: pricePerSeat,
      totalPrice: totalPrice,
      status: status ?? this.status,
      createdAt: createdAt,
    );
  }
}
