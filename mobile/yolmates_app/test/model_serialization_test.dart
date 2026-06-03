import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/shared/mock/mock_data.dart';
import 'package:yolmates_app/shared/models/ride.dart';

void main() {
  test('ride model serializes and deserializes', () {
    final json = mockRides.first.toJson();
    final ride = Ride.fromJson(json);

    expect(ride.id, mockRides.first.id);
    expect(ride.driver.fullName, mockRides.first.driver.fullName);
    expect(ride.status, mockRides.first.status);
  });
}
