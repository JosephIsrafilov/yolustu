import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/network/providers.dart';
import '../../auth/state/auth_controller.dart';
import '../../notifications/data/notifications_controller.dart';
import 'chat_models.dart';
import 'chat_repository.dart';

final conversationsProvider = FutureProvider.autoDispose<List<Conversation>>((ref) async {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.getConversations();
});

final unreadChatCountProvider = Provider<int>((ref) {
  final conversations = ref.watch(conversationsProvider).valueOrNull ?? const <Conversation>[];
  return conversations.fold<int>(0, (sum, conversation) => sum + conversation.unreadCount);
});

final unreadNotificationCountProvider = Provider<int>((ref) {
  return ref.watch(
    notificationsProvider.select((items) => items.where((item) => !item.read).length),
  );
});

class ChatMessagesNotifier extends AutoDisposeFamilyAsyncNotifier<List<ChatMessage>, String> {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  bool _disposed = false;
  String? _currentUserId;

  @override
  Future<List<ChatMessage>> build(String arg) async {
    final repo = ref.watch(chatRepositoryProvider);
    _currentUserId = ref.read(authControllerProvider).user?.id;
    ref.onDispose(() {
      _disposed = true;
      _reconnectTimer?.cancel();
      _subscription?.cancel();
      _channel?.sink.close();
    });

    final messages = await repo.getMessages(arg);
    await _markAsRead();
    await _connect();

    return messages;
  }

  Future<void> _connect() async {
    _subscription?.cancel();
    await _channel?.sink.close();

    // ponytail: backend websocket only broadcasts message payloads today, so reconnect stays local here.
    final token = await ref.read(authTokenStorageProvider).getAccessToken();
    if (token == null || _disposed) return;

    final repo = ref.read(chatRepositoryProvider);
    _channel = repo.connectWebSocket(arg, token);
    if (_channel == null) return;

    _subscription = _channel!.stream.listen(
      _handleSocketEvent,
      onDone: _scheduleReconnect,
      onError: (_, __) => _scheduleReconnect(),
      cancelOnError: true,
    );
  }

  void _handleSocketEvent(dynamic event) {
    try {
      final decoded = jsonDecode(event as String);
      if (decoded is! Map<String, dynamic>) return;
      final payload = decoded['data'] is Map<String, dynamic>
          ? decoded['data'] as Map<String, dynamic>
          : decoded;
      final newMessage = ChatMessage.fromJson(payload);
      final current = state.value ?? const <ChatMessage>[];
      if (current.any((message) => message.id == newMessage.id)) return;
      state = AsyncData([...current, newMessage]);
      ref.invalidate(conversationsProvider);
      if (newMessage.senderId != _currentUserId) {
        unawaited(_markAsRead());
      }
    } catch (_) {
      // Ignore malformed websocket payloads.
    }
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 2), () {
      if (_disposed) return;
      unawaited(_connect());
    });
  }

  Future<void> _markAsRead() async {
    try {
      await ref.read(chatRepositoryProvider).markAsRead(arg);
      ref.invalidate(conversationsProvider);
    } catch (_) {
      // Best effort: chat stays usable even if read syncing fails.
    }
  }

  Future<void> sendMessage(String content, {String type = 'text', List<String> attachments = const []}) async {
    final repo = ref.read(chatRepositoryProvider);
    final prev = state.value ?? [];
    try {
      final msg = await repo.sendMessage(arg, content, type: type, attachments: attachments);
      // Ensure we don't duplicate if websocket already got it
      if (!prev.any((e) => e.id == msg.id)) {
        state = AsyncData([...prev, msg]);
      }
      ref.invalidate(conversationsProvider);
    } catch (e) {
      // Could show error
      rethrow;
    }
  }

  Future<void> sendImageMessage(String filePath) async {
    final repo = ref.read(chatRepositoryProvider);
    final prev = state.value ?? [];
    try {
      final url = await repo.uploadAttachment(filePath);
      final msg = await repo.sendMessage(arg, '', type: 'photo', attachments: [url]);
      if (!prev.any((e) => e.id == msg.id)) {
        state = AsyncData([...prev, msg]);
      }
      ref.invalidate(conversationsProvider);
    } catch (e) {
      rethrow;
    }
  }
}

final chatMessagesProvider = AsyncNotifierProvider.autoDispose.family<ChatMessagesNotifier, List<ChatMessage>, String>(
  ChatMessagesNotifier.new,
);
