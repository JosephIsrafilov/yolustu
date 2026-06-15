import 'package:flutter_riverpod/flutter_riverpod.dart';


/// App notification (mock).
class AppNotification {
  final String id;
  final String title;
  final String body;
  final DateTime time;
  final bool read;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    this.read = false,
  });

  AppNotification copyWith({bool? read}) => AppNotification(
        id: id,
        title: title,
        body: body,
        time: time,
        read: read ?? this.read,
      );
}

/// Seeded notifications list; backend swap point.
final notificationsProvider =
    NotifierProvider<NotificationsController, List<AppNotification>>(
  NotificationsController.new,
);

class NotificationsController extends Notifier<List<AppNotification>> {
  @override
  List<AppNotification> build() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'n-1',
        title: 'Xoş gəldiniz!',
        body: 'Yolmates-ə qoşulduğunuz üçün təşəkkür edirik.',
        time: now.subtract(const Duration(minutes: 5)),
      ),
      AppNotification(
        id: 'n-2',
        title: 'Profilinizi tamamlayın',
        body: 'Daha çox sürücü ilə əlaqə üçün profilinizi doldurun.',
        time: now.subtract(const Duration(hours: 3)),
      ),
      AppNotification(
        id: 'n-3',
        title: 'Təhlükəsizlik məsləhəti',
        body: 'Səyahətdən əvvəl sürücünün reytinqini yoxlayın.',
        time: now.subtract(const Duration(days: 1)),
        read: true,
      ),
    ];
  }

  int get unreadCount => state.where((n) => !n.read).length;

  void markAllRead() {
    state = [for (final n in state) n.copyWith(read: true)];
  }

  void markRead(String id) {
    state = [
      for (final n in state)
        if (n.id == id) n.copyWith(read: true) else n,
    ];
  }

  void addNotification({
    required String id,
    required String title,
    required String body,
    DateTime? time,
  }) {
    state = [
      AppNotification(
        id: id,
        title: title,
        body: body,
        time: time ?? DateTime.now(),
      ),
      ...state.where((notification) => notification.id != id),
    ];
  }
}
