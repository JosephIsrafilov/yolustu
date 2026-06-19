class RideLifecycle {
  static const nearEndThreshold = Duration(minutes: 1);

  static bool canFinish({
    required Duration remaining,
    required bool isCompleted,
  }) {
    return isCompleted || remaining < nearEndThreshold;
  }

  static Duration remainingFromProgress({
    required double progress,
    Duration simulatedDuration = const Duration(minutes: 60),
  }) {
    final clamped = progress.clamp(0.0, 1.0);
    final remainingMs =
        (simulatedDuration.inMilliseconds * (1.0 - clamped)).round();
    return Duration(milliseconds: remainingMs);
  }
}
