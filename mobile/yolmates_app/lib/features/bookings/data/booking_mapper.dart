import 'booking.dart';
import 'booking_dto.dart';

/// Maps backend BookingDto to mobile Booking model.
class BookingMapper {
  /// Map BookingDto to Booking.
  ///
  /// Backend returns nested ride (RideResponse). Mobile Booking expects flattened fields.
  static Booking toBooking(BookingDto dto) {
    // Extract ride fields or use safe defaults if ride not nested
    String fromCity = '';
    String toCity = '';
    String driverName = 'Sürücü';
    String driverId = dto.rideId; // fallback to ride id until driver nested
    DateTime departureTime = DateTime.now();
    double pricePerSeat = 0.0;

    if (dto.ride != null) {
      fromCity = dto.ride!.originCity;
      toCity = dto.ride!.destinationCity;
      departureTime = dto.ride!.departureTime;
      pricePerSeat = dto.ride!.pricePerSeat;

      if (dto.ride!.driver != null) {
        driverName = dto.ride!.driver!.fullName;
        driverId = dto.ride!.driver!.id;
      }
    }

    return Booking(
      id: dto.id,
      rideId: dto.rideId,
      driverId: driverId,
      fromCity: fromCity,
      toCity: toCity,
      driverName: driverName,
      departureTime: departureTime,
      seats: dto.seatsBooked,
      selectedSpots: dto.selectedSpots,
      pricePerSeat: pricePerSeat,
      status: _parseStatus(dto.status),
      createdAt: dto.createdAt,
    );
  }

  /// Parse backend status string to BookingStatus enum.
  ///
  /// Backend status values: pending, accepted, rejected, cancelled, paid, completed.
  /// Mobile enum: pending, confirmed, rejected, cancelled, paid, completed.
  /// Map "accepted" → confirmed.
  static BookingStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return BookingStatus.pending;
      case 'accepted':
      case 'confirmed':
        return BookingStatus.confirmed;
      case 'rejected':
        return BookingStatus.rejected;
      case 'cancelled':
        return BookingStatus.cancelled;
      case 'paid':
        return BookingStatus.paid;
      case 'completed':
        return BookingStatus.completed;
      default:
        return BookingStatus.pending; // Safe fallback
    }
  }
}
