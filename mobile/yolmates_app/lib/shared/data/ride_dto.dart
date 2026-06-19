/// Backend RideResponse DTO.
///
/// Maps snake_case backend fields to Dart types.
/// Backend shape from `app/domains/trips/schemas.py`:
/// - id: UUID
/// - driver_id: UUID
/// - vehicle_id: UUID
/// - departure_time: datetime
/// - total_seats: int
/// - available_seats: int
/// - price_per_seat: Decimal
/// - origin_city: str
/// - destination_city: str
/// - intermediate_cities: Optional[str]
/// - status: str
/// - description: Optional[str]
/// - smoking_allowed: bool
/// - pets_allowed: bool
/// - music_allowed: bool
/// - female_only: bool
/// - created_at: datetime
/// - origin_location: Location {lat, lon}
/// - destination_location: Location {lat, lon}
/// - vehicle: Optional[VehicleResponse]
/// - driver: Optional[UserResponse]
class RideDto {
  final String id;
  final String driverId;
  final String vehicleId;
  final DateTime departureTime;
  final int totalSeats;
  final int availableSeats;
  final List<String> availableSpots;
  final double pricePerSeat;
  final String originCity;
  final String destinationCity;
  final String? intermediateCities;
  final String status;
  final String? description;
  final bool smokingAllowed;
  final bool petsAllowed;
  final bool musicAllowed;
  final bool femaleOnly;
  final DateTime createdAt;
  final DriverDto? driver;
  final VehicleDto? vehicle;

  const RideDto({
    required this.id,
    required this.driverId,
    required this.vehicleId,
    required this.departureTime,
    required this.totalSeats,
    required this.availableSeats,
    this.availableSpots = const [],
    required this.pricePerSeat,
    required this.originCity,
    required this.destinationCity,
    this.intermediateCities,
    required this.status,
    this.description,
    required this.smokingAllowed,
    required this.petsAllowed,
    required this.musicAllowed,
    required this.femaleOnly,
    required this.createdAt,
    this.driver,
    this.vehicle,
  });

  factory RideDto.fromJson(Map<String, dynamic> json) {
    return RideDto(
      id: json['id']?.toString() ?? '',
      driverId: json['driver_id']?.toString() ?? '',
      vehicleId: json['vehicle_id']?.toString() ?? '',
      departureTime: json['departure_time'] != null
          ? DateTime.tryParse(json['departure_time'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      totalSeats: json['total_seats'] as int? ?? 1,
      availableSeats: json['available_seats'] as int? ?? 1,
      availableSpots: (json['available_spots'] as List?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      pricePerSeat: _parseDecimal(json['price_per_seat']),
      originCity: json['origin_city']?.toString() ?? '',
      destinationCity: json['destination_city']?.toString() ?? '',
      intermediateCities: json['intermediate_cities']?.toString(),
      status: json['status']?.toString() ?? 'unknown',
      description: json['description']?.toString(),
      smokingAllowed: json['smoking_allowed'] as bool? ?? false,
      petsAllowed: json['pets_allowed'] as bool? ?? false,
      musicAllowed: json['music_allowed'] as bool? ?? true,
      femaleOnly: json['female_only'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      driver: json['driver'] != null
          ? DriverDto.fromJson(json['driver'] as Map<String, dynamic>)
          : null,
      vehicle: json['vehicle'] != null
          ? VehicleDto.fromJson(json['vehicle'] as Map<String, dynamic>)
          : null,
    );
  }

  static double _parseDecimal(dynamic value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.parse(value);
    return 0.0;
  }
}

/// Backend UserResponse for driver.
class DriverDto {
  final String id;
  final String? firstName;
  final String? lastName;
  final String phone;
  final String? avatarUrl;
  final double rating;
  final int totalRides;
  final bool isVerified;

  const DriverDto({
    required this.id,
    this.firstName,
    this.lastName,
    required this.phone,
    this.avatarUrl,
    required this.rating,
    required this.totalRides,
    this.isVerified = false,
  });

  factory DriverDto.fromJson(Map<String, dynamic> json) {
    return DriverDto(
      id: json['id']?.toString() ?? '',
      firstName: json['first_name']?.toString(),
      lastName: json['last_name']?.toString(),
      phone: json['phone']?.toString() ?? '',
      avatarUrl: json['avatar_url']?.toString(),
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      totalRides: json['total_rides'] as int? ?? 0,
      isVerified: json['is_verified'] as bool? ?? false,
    );
  }

  String get fullName {
    final parts = [firstName, lastName].where((p) => p != null && p.isNotEmpty);
    return parts.isEmpty ? 'Sürücü' : parts.join(' ');
  }
}

/// Backend VehicleResponse.
class VehicleDto {
  final String id;
  final String brand;
  final String model;
  final int year;
  final String color;
  final String plateNumber;

  const VehicleDto({
    required this.id,
    required this.brand,
    required this.model,
    required this.year,
    required this.color,
    required this.plateNumber,
  });

  factory VehicleDto.fromJson(Map<String, dynamic> json) {
    return VehicleDto(
      id: json['id']?.toString() ?? '',
      brand: json['brand']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      year: json['year'] as int? ?? 2000,
      color: json['color']?.toString() ?? '',
      plateNumber: json['plate_number']?.toString() ?? '',
    );
  }
}
