import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/rides/data/rides_repository.dart';
import 'package:yolmates_app/features/rides/domain/ride_search_filters.dart';

void main() {
  test('mock ride repository filters rides by route', () async {
    const repository = MockRideRepository();

    final rides = await repository.searchRides(
      const RideSearchFilters(fromCity: 'Bakı', toCity: 'Gəncə'),
    );

    expect(rides, hasLength(1));
    expect(rides.first.id, 'ride-1');
  });
}
