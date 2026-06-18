import 'package:dio/dio.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../shared/data/city_coordinates.dart';
import '../../shared/data/ride_dto.dart';
import '../../shared/data/ride_mapper.dart';
import '../../shared/models/trip.dart';
import 'rides_repository.dart';

/// Real backend rides implementation.
///
/// Endpoints:
/// - GET /rides/search
/// - GET /rides/{ride_id}
class ApiRidesRepository implements RidesRepository {
  final ApiClient _client;

  ApiRidesRepository(this._client);

  @override
  Future<List<Trip>> search({
    required String fromCity,
    required String toCity,
    DateTime? date,
    DateTime? dateTo,
    int passengers = 1,
  }) async {
    try {
      // Build query params
      final params = <String, dynamic>{
        if (!_isAllCities(fromCity)) 'origin_city': fromCity,
        if (!_isAllCities(toCity)) 'dest_city': toCity,
        'min_seats': passengers,
        'limit': 20,
        'offset': 0,
      };

      // Date filtering: range takes precedence over single date.
      // Backend supports departure_date_from / departure_date_to (week mode)
      // or departure_date for a specific day.
      if (date != null && dateTo != null) {
        params['departure_date_from'] = _formatDate(date);
        params['departure_date_to'] = _formatDate(dateTo);
      } else if (date != null) {
        params['departure_date'] = _formatDate(date);
      }
      // Omitting date params means any upcoming date.

      // Add coordinates if available (improves backend spatial search)
      final fromCoords = CityCoordinates.get(fromCity);
      final toCoords = CityCoordinates.get(toCity);
      if (!_isAllCities(fromCity) && fromCoords != null) {
        params['origin_lat'] = fromCoords.lat;
        params['origin_lon'] = fromCoords.lon;
      }
      if (!_isAllCities(toCity) && toCoords != null) {
        params['dest_lat'] = toCoords.lat;
        params['dest_lon'] = toCoords.lon;
      }

      final response =
          await _client.get('/rides/search', queryParameters: params);

      // Extract list from response
      final data = response.data;
      final List<dynamic> rides;

      if (data is List) {
        rides = data;
      } else if (data is Map<String, dynamic> && data['items'] is List) {
        rides = data['items'] as List<dynamic>;
      } else if (data is Map<String, dynamic> && data['data'] is List) {
        rides = data['data'] as List<dynamic>;
      } else {
        rides = [];
      }

      return rides
          .map((json) =>
              RideMapper.toTrip(RideDto.fromJson(json as Map<String, dynamic>)))
          .where((trip) => trip.fromCity != trip.toCity)
          .toList();
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }

  @override
  Future<Trip?> rideById(String id) async {
    try {
      final response = await _client.get('/rides/$id');

      final data = response.data;
      final Map<String, dynamic> rideJson;

      if (data is Map<String, dynamic>) {
        if (data['data'] != null) {
          rideJson = data['data'] as Map<String, dynamic>;
        } else {
          rideJson = data;
        }
      } else {
        return null;
      }

      return RideMapper.toTrip(RideDto.fromJson(rideJson));
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      if (apiError.statusCode == 404) {
        return null;
      }
      throw Exception(apiError.message);
    }
  }

  @override
  Future<void> startBoarding(String rideId) async {
    try {
      await _client.post('/rides/$rideId/board');
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }

  @override
  Future<void> endTrip(String rideId) async {
    try {
      await _client.post('/rides/$rideId/end');
    } on DioException catch (e) {
      final apiError = e.error as ApiException;
      throw Exception(apiError.message);
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  bool _isAllCities(String value) {
    final n = value.trim().toLowerCase();
    return n.contains('all') ||
        n.contains('bütün') ||
        n.contains('butun') ||
        n.contains('şəhər') ||
        n.contains('seher');
  }
}
