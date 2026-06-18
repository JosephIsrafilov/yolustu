import '../models/trip.dart';
import '../models/user.dart';
import 'ride_dto.dart';

/// Maps backend RideDto to mobile Trip/User models.
class RideMapper {
  /// Map RideDto to Trip.
  ///
  /// Backend has nested driver/vehicle. Mobile Trip expects driver as User.
  static Trip toTrip(RideDto dto) {
    return Trip(
      id: dto.id,
      driver: _toUser(dto.driver, dto.driverId),
      fromCity: dto.originCity,
      toCity: dto.destinationCity,
      departureTime: dto.departureTime,
      price: dto.pricePerSeat,
      availableSeats: dto.availableSeats,
      totalSeats: dto.totalSeats,
      status: dto.status,
      femaleOnly: dto.femaleOnly,
      allowSmoking: dto.smokingAllowed,
      allowPets: dto.petsAllowed,
      allowMusic: dto.musicAllowed,
    );
  }

  /// Map DriverDto to User.
  ///
  /// Backend may return null driver if not eagerly loaded.
  /// Fallback to safe defaults.
  static User _toUser(DriverDto? driver, String driverId) {
    if (driver == null) {
      return User(
        id: driverId,
        name: 'Sürücü',
        phone: '',
        rating: 0.0,
        tripCount: 0,
      );
    }

    return User(
      id: driver.id,
      name: driver.fullName,
      phone: driver.phone,
      avatarUrl: driver.avatarUrl,
      rating: driver.rating,
      tripCount: driver.totalRides,
      isVerified: driver.isVerified,
    );
  }
}
