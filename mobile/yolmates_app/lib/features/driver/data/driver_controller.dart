import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/providers.dart';
import '../../../shared/data/city_coordinates.dart';
import '../../../shared/data/ride_dto.dart';
import '../../auth/data/auth_mode.dart';
import 'driver_ride.dart';
import 'vehicle.dart';

/// Driver-side store contract (rides + vehicles). Backend swap point.
abstract class DriverRepository {
  Future<List<DriverRide>> rides();
  Future<DriverRide> publishRide(DriverRide ride);
  Future<DriverRide> updateRideStatus(String id, DriverRideStatus status);

  Future<List<Vehicle>> vehicles();
  Future<Vehicle> saveVehicle(Vehicle vehicle);
  Future<void> deleteVehicle(String id);
}

// --- API implementation ------------------------------------------------------

class ApiDriverRepository implements DriverRepository {
  final ApiClient _client;

  ApiDriverRepository(this._client);

  @override
  Future<List<DriverRide>> rides() async {
    try {
      final response = await _client.get('/rides/my');
      final data = response.data;
      final List<dynamic> items = data is List
          ? data
          : (data is Map ? (data['items'] ?? data['data'] ?? []) : []);
      return items
          .map((e) => _rideFromDto(RideDto.fromJson(e as Map<String, dynamic>)))
          .toList();
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  @override
  Future<DriverRide> publishRide(DriverRide ride) async {
    try {
      final origin = CityCoordinates.get(ride.fromCity);
      final dest = CityCoordinates.get(ride.toCity);
      final response = await _client.post('/rides', data: {
        'origin_city': ride.fromCity,
        'destination_city': ride.toCity,
        'departure_time': ride.departureTime.toIso8601String(),
        'total_seats': ride.seats,
        'available_seats': ride.seats,
        'price_per_seat': ride.pricePerSeat,
        'description': ride.description.isEmpty ? null : ride.description,
        'smoking_allowed': ride.allowSmoking,
        'music_allowed': ride.allowMusic,
        'origin': {
          'lat': origin?.lat ?? 40.4093,
          'lon': origin?.lon ?? 49.8671
        },
        'destination': {
          'lat': dest?.lat ?? 40.4093,
          'lon': dest?.lon ?? 49.8671
        },
      });
      final data = response.data;
      final json = data is Map<String, dynamic>
          ? (data['data'] as Map<String, dynamic>? ?? data)
          : data as Map<String, dynamic>;
      return _rideFromDto(RideDto.fromJson(json));
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  @override
  Future<DriverRide> updateRideStatus(
      String id, DriverRideStatus status) async {
    try {
      final endpoint = status == DriverRideStatus.cancelled
          ? '/rides/$id/cancel'
          : '/rides/$id/complete';
      final response = await _client.patch(endpoint);
      final data = response.data;
      final json = data is Map<String, dynamic>
          ? (data['data'] as Map<String, dynamic>? ?? data)
          : data as Map<String, dynamic>;
      return _rideFromDto(RideDto.fromJson(json));
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  @override
  Future<List<Vehicle>> vehicles() async {
    try {
      final response = await _client.get('/vehicles/my');
      final data = response.data;
      final List<dynamic> items = data is List
          ? data
          : (data is Map ? (data['items'] ?? data['data'] ?? []) : []);
      return items
          .map((e) => _vehicleFromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  @override
  Future<Vehicle> saveVehicle(Vehicle vehicle) async {
    try {
      final response = await _client.post('/vehicles', data: {
        'brand': vehicle.brand,
        'model': vehicle.model,
        'year': vehicle.year,
        'color': vehicle.color,
        'plate_number': vehicle.plate,
      });
      final data = response.data;
      final json = data is Map<String, dynamic>
          ? (data['data'] as Map<String, dynamic>? ?? data)
          : data as Map<String, dynamic>;
      return _vehicleFromJson(json);
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  @override
  Future<void> deleteVehicle(String id) async {
    try {
      await _client.delete('/vehicles/$id');
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  // --- Mappers ----------------------------------------------------------------

  DriverRide _rideFromDto(RideDto dto) {
    return DriverRide(
      id: dto.id,
      fromCity: dto.originCity,
      toCity: dto.destinationCity,
      departureTime: dto.departureTime,
      seats: dto.totalSeats,
      pricePerSeat: dto.pricePerSeat,
      allowSmoking: dto.smokingAllowed,
      allowMusic: dto.musicAllowed,
      description: dto.description ?? '',
      status: _parseStatus(dto.status),
    );
  }

  DriverRideStatus _parseStatus(String s) {
    switch (s) {
      case 'active':
        return DriverRideStatus.active;
      case 'completed':
        return DriverRideStatus.completed;
      case 'cancelled':
        return DriverRideStatus.cancelled;
      default:
        return DriverRideStatus.upcoming;
    }
  }

  Vehicle _vehicleFromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'].toString(),
      brand: json['brand'] as String,
      model: json['model'] as String,
      year: json['year'] as int,
      color: json['color'] as String,
      plate: json['plate_number'] as String,
      seats: json['seats'] as int? ?? 4,
    );
  }
}

// --- Mock implementation (kept for offline dev) ------------------------------

class MockDriverRepository implements DriverRepository {
  static const Duration _latency = Duration(milliseconds: 600);

  final List<DriverRide> _rides = [];
  final List<Vehicle> _vehicles = [];

  @override
  Future<List<DriverRide>> rides() async {
    await Future.delayed(_latency);
    return [..._rides]
      ..sort((a, b) => a.departureTime.compareTo(b.departureTime));
  }

  @override
  Future<DriverRide> publishRide(DriverRide ride) async {
    await Future.delayed(_latency);
    _rides.add(ride);
    return ride;
  }

  @override
  Future<DriverRide> updateRideStatus(
      String id, DriverRideStatus status) async {
    await Future.delayed(_latency);
    final i = _rides.indexWhere((r) => r.id == id);
    if (i == -1) throw StateError('Ride $id not found');
    final updated = _rides[i].copyWith(status: status);
    _rides[i] = updated;
    return updated;
  }

  @override
  Future<List<Vehicle>> vehicles() async {
    await Future.delayed(_latency);
    return [..._vehicles];
  }

  @override
  Future<Vehicle> saveVehicle(Vehicle vehicle) async {
    await Future.delayed(_latency);
    final i = _vehicles.indexWhere((v) => v.id == vehicle.id);
    if (i == -1) {
      _vehicles.add(vehicle);
    } else {
      _vehicles[i] = vehicle;
    }
    return vehicle;
  }

  @override
  Future<void> deleteVehicle(String id) async {
    await Future.delayed(_latency);
    _vehicles.removeWhere((v) => v.id == id);
  }
}

// --- Providers ---------------------------------------------------------------

final driverRepositoryProvider = Provider<DriverRepository>((ref) {
  if (AuthMode.isApi) {
    return ApiDriverRepository(ref.read(apiClientProvider));
  }
  return MockDriverRepository();
});

final driverRidesProvider =
    AsyncNotifierProvider<DriverRidesController, List<DriverRide>>(
  DriverRidesController.new,
);

class DriverRidesController extends AsyncNotifier<List<DriverRide>> {
  DriverRepository get _repo => ref.read(driverRepositoryProvider);

  @override
  Future<List<DriverRide>> build() => _repo.rides();

  Future<DriverRide> publish(DriverRide ride) async {
    final created = await _repo.publishRide(ride);
    state = AsyncData(await _repo.rides());
    return created;
  }

  Future<void> setStatus(String id, DriverRideStatus status) async {
    await _repo.updateRideStatus(id, status);
    state = AsyncData(await _repo.rides());
  }
}

final vehiclesProvider =
    AsyncNotifierProvider<VehiclesController, List<Vehicle>>(
  VehiclesController.new,
);

class VehiclesController extends AsyncNotifier<List<Vehicle>> {
  DriverRepository get _repo => ref.read(driverRepositoryProvider);

  @override
  Future<List<Vehicle>> build() => _repo.vehicles();

  Future<Vehicle> save(Vehicle vehicle) async {
    final saved = await _repo.saveVehicle(vehicle);
    state = AsyncData(await _repo.vehicles());
    return saved;
  }

  Future<void> remove(String id) async {
    await _repo.deleteVehicle(id);
    state = AsyncData(await _repo.vehicles());
  }
}

// --- Passenger requests ------------------------------------------------------

class PassengerRequestsController
    extends AsyncNotifier<List<PassengerRequest>> {
  @override
  Future<List<PassengerRequest>> build() => _load();

  Future<List<PassengerRequest>> _load() async {
    if (!AuthMode.isApi) return [];
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.get('/bookings/requests');
      final data = response.data;
      final List<dynamic> items = data is List
          ? data
          : (data is Map ? (data['items'] ?? data['data'] ?? []) : []);
      return items.map((e) => _fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  Future<void> setStatus(String id, RequestStatus status) async {
    if (!AuthMode.isApi) {
      state = AsyncData([
        for (final r in state.valueOrNull ?? [])
          if (r.id == id) r.copyWith(status: status) else r,
      ]);
      return;
    }
    final client = ref.read(apiClientProvider);
    final endpoint = status == RequestStatus.accepted
        ? '/bookings/$id/confirm'
        : '/bookings/$id/reject';
    try {
      await client.post(endpoint);
      state = AsyncData(await _load());
    } on DioException catch (e) {
      final err = e.error as ApiException;
      throw Exception(err.message);
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_load);
  }

  PassengerRequest _fromJson(Map<String, dynamic> json) {
    final passenger = json['passenger'] as Map<String, dynamic>?;
    final ride = json['ride'] as Map<String, dynamic>?;
    final passengerName = passenger != null
        ? '${passenger['first_name'] ?? ''} ${passenger['last_name'] ?? ''}'
            .trim()
        : 'Sərnişin';
    return PassengerRequest(
      id: json['id'].toString(),
      passengerName: passengerName.isEmpty ? 'Sərnişin' : passengerName,
      fromCity: ride?['origin_city'] as String? ?? '',
      toCity: ride?['destination_city'] as String? ?? '',
      departureTime: ride != null
          ? DateTime.parse(ride['departure_time'] as String)
          : DateTime.now(),
      seats: json['seats_booked'] as int? ?? 1,
      rating: (passenger?['rating'] as num?)?.toDouble() ?? 0.0,
      status: _parseRequestStatus(json['status'] as String? ?? 'pending'),
    );
  }

  RequestStatus _parseRequestStatus(String s) {
    switch (s) {
      case 'accepted':
        return RequestStatus.accepted;
      case 'rejected':
        return RequestStatus.rejected;
      default:
        return RequestStatus.pending;
    }
  }
}

final passengerRequestsProvider =
    AsyncNotifierProvider<PassengerRequestsController, List<PassengerRequest>>(
  PassengerRequestsController.new,
);
