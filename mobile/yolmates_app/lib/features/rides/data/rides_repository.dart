import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_result.dart';
import '../../../shared/mock/mock_data.dart';
import '../../../shared/models/ride.dart';
import '../domain/ride_repository.dart';
import '../domain/ride_search_filters.dart';

class MockRideRepository implements RideRepository {
  const MockRideRepository();

  @override
  Future<ApiResult<Ride>> createRide(Map<String, dynamic> payload) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return ApiSuccess<Ride>(
      Ride.fromJson(<String, dynamic>{
        ...mockRides.first.toJson(),
        ...payload,
        'id': 'ride-mock-created',
      }),
    );
  }

  @override
  Future<Ride?> getRideById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    for (final Ride ride in mockRides) {
      if (ride.id == id) {
        return ride;
      }
    }
    return null;
  }

  @override
  Future<List<Ride>> searchRides(RideSearchFilters params) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return mockRides.where((Ride ride) {
      final matchesFrom =
          params.fromCity == null ||
          params.fromCity!.isEmpty ||
          ride.fromCity == params.fromCity;
      final matchesTo =
          params.toCity == null ||
          params.toCity!.isEmpty ||
          ride.toCity == params.toCity;
      final matchesSeats =
          params.seats == null || ride.availableSeats >= params.seats!;
      return matchesFrom && matchesTo && matchesSeats;
    }).toList();
  }

  @override
  Future<List<Ride>> getDriverRides() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return mockRides.where((Ride ride) => ride.driver.id == mockDriverOne.id).toList();
  }
}

class RealRideRepository implements RideRepository {
  const RealRideRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<ApiResult<Ride>> createRide(Map<String, dynamic> payload) async {
    try {
      final response = await _apiClient.dio.post<Map<String, dynamic>>(
        ApiEndpoints.rides,
        data: payload,
      );
      return ApiSuccess<Ride>(Ride.fromJson(response.data ?? <String, dynamic>{}));
    } catch (error) {
      return ApiFailure<Ride>('Failed to create ride: $error');
    }
  }

  @override
  Future<Ride?> getRideById(String id) async {
    try {
      final response = await _apiClient.dio.get<Map<String, dynamic>>(
        '${ApiEndpoints.rides}/$id',
      );
      return Ride.fromJson(response.data ?? <String, dynamic>{});
    } catch (_) {
      return null;
    }
  }

  @override
  Future<List<Ride>> searchRides(RideSearchFilters params) async {
    try {
      final response = await _apiClient.dio.get<List<dynamic>>(
        ApiEndpoints.ridesSearch,
        queryParameters: params.toQueryParameters(),
      );
      return response.data
              ?.whereType<Map<String, dynamic>>()
              .map(Ride.fromJson)
              .toList() ??
          <Ride>[];
    } catch (error) {
      throw Exception('Unable to load rides: $error');
    }
  }

  @override
  Future<List<Ride>> getDriverRides() async {
    try {
      final response = await _apiClient.dio.get<List<dynamic>>('${ApiEndpoints.rides}/my');
      return response.data
              ?.whereType<Map<String, dynamic>>()
              .map(Ride.fromJson)
              .toList() ??
          <Ride>[];
    } catch (error) {
      throw Exception('Unable to load driver rides: $error');
    }
  }
}

final rideRepositoryProvider = Provider<RideRepository>((ref) {
  if (AppConfig.isMockMode) {
    return const MockRideRepository();
  }

  return RealRideRepository(ref.watch(apiClientProvider));
});

final ridesRepositoryProvider = rideRepositoryProvider;
