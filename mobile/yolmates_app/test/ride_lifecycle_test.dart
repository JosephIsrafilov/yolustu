import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/trips/ride_lifecycle.dart';

void main() {
  group('RideLifecycle passenger flow', () {
    test('Men catdim is always enabled for demo arrival confirmation', () {
      expect(RideLifecycle.canConfirmPassengerArrival(), isTrue);
    });
  });

  group('RideLifecycle driver flow', () {
    test('complete ride is disabled before ride is near end', () {
      expect(
        RideLifecycle.canFinish(
          remaining: const Duration(minutes: 10),
          isCompleted: false,
        ),
        isFalse,
      );
    });

    test('complete ride is enabled near end', () {
      expect(
        RideLifecycle.canFinish(
          remaining: const Duration(seconds: 30),
          isCompleted: false,
        ),
        isTrue,
      );
    });
  });
}
