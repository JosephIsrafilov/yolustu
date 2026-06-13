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
    required DateTime date,
    int passengers = 1,
  }) async {
    try {
      // Build query params
      final params = <String, dynamic>{
        'origin_city': fromCity,
        'dest_city': toCity,
        'min_seats': passengers,
        'limit': 20,
        'offset': 0,
      };

      // Add date if provided (backend expects YYYY-MM-DD)
      params['departure_date'] = _formatDate(date);

      // Add coordinates if available (improves backend spatial search)
      final fromCoords = CityCoordinates.get(fromCity);
      final toCoords = CityCoordinates.get(toCity);
      if (fromCoords != null) {
        params['origin_lat'] = fromCoords.lat;
        params['origin_lon'] = fromCoords.lon;
      }
      if (toCoords != null) {
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
      } else if (data is Map<String, dynamic> && data['data'] is List) {
        rides = data['data'] as List<dynamic>;
      } else {
        rides = [];
      }

      return rides
          .map((json) =>
              RideMapper.toTrip(RideDto.fromJson(json as Map<String, dynamic>)))
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

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
