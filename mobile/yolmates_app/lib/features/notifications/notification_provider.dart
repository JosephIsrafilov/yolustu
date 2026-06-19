import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppNotificationType { success, error, info }

class AppNotification {
  final String id;
  final String message;
  final AppNotificationType type;
  final Duration duration;

  AppNotification({
    required this.id,
    required this.message,
    required this.type,
    this.duration = const Duration(seconds: 3),
  });
}

class NotificationNotifier extends StateNotifier<List<AppNotification>> {
  NotificationNotifier() : super([]);

  final Map<String, Timer> _timers = {};

  // Anti-spam deduplication
  DateTime? _lastNotificationTime;
  String? _lastNotificationMessage;

  void showSuccess(String message) => _addNotification(
      message, AppNotificationType.success, const Duration(seconds: 3));
  void showError(String message) => _addNotification(
      message, AppNotificationType.error, const Duration(seconds: 5));
  void showInfo(String message) => _addNotification(
      message, AppNotificationType.info, const Duration(seconds: 3));

  void _addNotification(
      String message, AppNotificationType type, Duration duration) {
    final now = DateTime.now();
    if (_lastNotificationMessage == message && _lastNotificationTime != null) {
      if (now.difference(_lastNotificationTime!) < const Duration(seconds: 2)) {
        return; // Ignore exact duplicate within 2 seconds
      }
    }

    _lastNotificationMessage = message;
    _lastNotificationTime = now;

    final id = DateTime.now().microsecondsSinceEpoch.toString();
    final notification = AppNotification(
        id: id, message: message, type: type, duration: duration);

    state = [...state, notification].takeLast(3).toList();

    _timers[id] = Timer(duration, () {
      remove(id);
    });
  }

  void remove(String id) {
    _timers[id]?.cancel();
    _timers.remove(id);
    state = state.where((n) => n.id != id).toList();
  }

  @override
  void dispose() {
    for (var timer in _timers.values) {
      timer.cancel();
    }
    _timers.clear();
    super.dispose();
  }
}

extension _TakeLast<T> on List<T> {
  Iterable<T> takeLast(int count) {
    if (length <= count) return this;
    return skip(length - count);
  }
}

final notificationProvider =
    StateNotifierProvider<NotificationNotifier, List<AppNotification>>((ref) {
  return NotificationNotifier();
});
