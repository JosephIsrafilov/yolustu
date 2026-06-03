import '../../../core/network/api_result.dart';
import '../../../shared/models/ride.dart';
import 'ride_search_filters.dart';

abstract class RideRepository {
  Future<List<Ride>> searchRides(RideSearchFilters params);

  Future<Ride?> getRideById(String id);

  Future<List<Ride>> getDriverRides();

  Future<ApiResult<Ride>> createRide(Map<String, dynamic> payload);
}
