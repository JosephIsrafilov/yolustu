import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../core/network/providers.dart';
import 'chat_models.dart';
import 'chat_repository.dart';

final conversationsProvider = FutureProvider.autoDispose<List<Conversation>>((ref) async {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.getConversations();
});

class ChatMessagesNotifier extends AutoDisposeFamilyAsyncNotifier<List<ChatMessage>, String> {
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;

  @override
  Future<List<ChatMessage>> build(String arg) async {
    final repo = ref.watch(chatRepositoryProvider);
    final messages = await repo.getMessages(arg);

    // Try to connect websocket
    final tokenStorage = ref.read(authTokenStorageProvider);
    final token = await tokenStorage.getAccessToken();
    if (token != null) {
      _channel = repo.connectWebSocket(arg, token);
      if (_channel != null) {
        _subscription = _channel!.stream.listen((event) {
          try {
            final data = jsonDecode(event);
            final newMsg = ChatMessage.fromJson(data);
            state = AsyncData([...state.value ?? [], newMsg]);
            repo.markAsRead(arg);
          } catch (e) {
            // ignore
          }
        });
      }
    }
    
    // Mark as read when opened
    repo.markAsRead(arg);
    
    ref.onDispose(() {
      _subscription?.cancel();
      _channel?.sink.close();
    });

    return messages;
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
    } catch (e) {
      // Could show error
      rethrow;
    }
  }
}

final chatMessagesProvider = AsyncNotifierProvider.autoDispose.family<ChatMessagesNotifier, List<ChatMessage>, String>(
  ChatMessagesNotifier.new,
);
