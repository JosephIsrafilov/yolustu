import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/shared/models/booking.dart';
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

  test('booking model serializes and deserializes', () {
    final json = mockBookings.first.toJson();
    final booking = Booking.fromJson(json);

    expect(booking.id, mockBookings.first.id);
    expect(booking.rideId, mockBookings.first.rideId);
    expect(booking.passengerId, mockBookings.first.passengerId);
    expect(booking.totalPrice, mockBookings.first.totalPrice);
    expect(booking.canCancel, isTrue);
  });
}
