import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/network/api_config.dart';
import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';

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

final notificationsProvider =
    NotifierProvider<NotificationsController, List<AppNotification>>(
  NotificationsController.new,
);

class NotificationsController extends Notifier<List<AppNotification>> {
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;

  @override
  List<AppNotification> build() {
    if (AuthMode.isApi) {
      // Connect after the first frame so the provider graph is settled.
      Future.microtask(_connect);
      ref.onDispose(_disconnect);
    }
    return [];
  }

  Future<void> _connect() async {
    final tokenStorage = ref.read(authTokenStorageProvider);
    final token = await tokenStorage.getAccessToken();
    if (token == null) return;

    final base = Uri.parse(ApiConfig.baseUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    // Remove /api/v1 suffix — WS endpoint lives at /api/v1/notifications/ws
    final wsUrl = base.replace(
      scheme: scheme,
      path: '${base.path}/notifications/ws',
      queryParameters: {'token': token},
    );

    try {
      _channel = WebSocketChannel.connect(wsUrl);
      _sub = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _scheduleReconnect(),
        onDone: _scheduleReconnect,
        cancelOnError: false,
      );
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic raw) {
    try {
      final json = jsonDecode(raw as String) as Map<String, dynamic>;
      if (json['type'] != 'notification') return;
      final id = json['data']?['booking_id'] as String? ??
          DateTime.now().millisecondsSinceEpoch.toString();
      addNotification(
        id: id,
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
      );
    } catch (_) {
      // malformed message — skip
    }
  }

  void _disconnect() {
    _sub?.cancel();
    _channel?.sink.close();
    _sub = null;
    _channel = null;
  }

  Timer? _reconnectTimer;

  void _scheduleReconnect() {
    _disconnect();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), _connect);
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
          id: id, title: title, body: body, time: time ?? DateTime.now()),
      ...state.where((n) => n.id != id),
    ];
  }
}

final unreadNotificationCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).where((n) => !n.read).length;
});
