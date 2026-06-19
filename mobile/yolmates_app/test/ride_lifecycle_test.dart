import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/trips/ride_lifecycle.dart';

void main() {
  group('RideLifecycle passenger flow', () {
    test('Men catdim is disabled before ride is near end', () {
      final remaining = RideLifecycle.remainingFromProgress(progress: 0.5);

      expect(
        RideLifecycle.canFinish(remaining: remaining, isCompleted: false),
        isFalse,
      );
    });

    test('Men catdim is enabled when remaining time is less than 1 minute', () {
      final remaining = RideLifecycle.remainingFromProgress(progress: 0.99);

      expect(
        RideLifecycle.canFinish(remaining: remaining, isCompleted: false),
        isTrue,
      );
    });

    test('Men catdim is enabled when backend marks ride completed', () {
      expect(
        RideLifecycle.canFinish(
          remaining: const Duration(minutes: 20),
          isCompleted: true,
        ),
        isTrue,
      );
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
