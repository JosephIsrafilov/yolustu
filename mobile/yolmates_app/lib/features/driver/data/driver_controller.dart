import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'driver_ride.dart';
import 'vehicle.dart';

/// Driver-side store contract (rides + vehicles). Backend swap point.
abstract class DriverRepository {
  Future<List<DriverRide>> rides();
  Future<DriverRide> publishRide(DriverRide ride);
  Future<DriverRide> updateRideStatus(String id, DriverRideStatus status);

  Future<List<Vehicle>> vehicles();
  Future<Vehicle> saveVehicle(Vehicle vehicle);
}

class MockDriverRepository implements DriverRepository {
  static const Duration _latency = Duration(milliseconds: 600);

  final List<DriverRide> _rides = [];
  final List<Vehicle> _vehicles = [];

  @override
  Future<List<DriverRide>> rides() async {
    await Future.delayed(_latency);
    final sorted = [..._rides]
      ..sort((a, b) => a.departureTime.compareTo(b.departureTime));
    return sorted;
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
}

// --- Providers ---------------------------------------------------------------

final driverRepositoryProvider = Provider<DriverRepository>(
  (ref) => MockDriverRepository(),
);

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
}

// --- Passenger requests ------------------------------------------------------

/// Incoming booking requests against the driver's rides.
///
/// Seeded with mock requests so the driver UI has content; accept/reject
/// transition status in memory.
final passengerRequestsProvider =
    NotifierProvider<PassengerRequestsController, List<PassengerRequest>>(
  PassengerRequestsController.new,
);

class PassengerRequestsController extends Notifier<List<PassengerRequest>> {
  @override
  List<PassengerRequest> build() {
    final now = DateTime.now();
    return [
      PassengerRequest(
        id: 'req-1',
        passengerName: 'Murad Qasımov',
        fromCity: 'Bakı',
        toCity: 'Gəncə',
        departureTime: now.add(const Duration(days: 1, hours: 2)),
        seats: 1,
        rating: 4.6,
      ),
      PassengerRequest(
        id: 'req-2',
        passengerName: 'Leyla Hacıyeva',
        fromCity: 'Bakı',
        toCity: 'Quba',
        departureTime: now.add(const Duration(days: 2, hours: 5)),
        seats: 2,
        rating: 4.9,
      ),
    ];
  }

  void setStatus(String id, RequestStatus status) {
    state = [
      for (final r in state)
        if (r.id == id) r.copyWith(status: status) else r,
    ];
  }
}
