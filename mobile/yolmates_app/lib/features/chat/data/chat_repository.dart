import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'chat_models.dart';

abstract class ChatRepository {
  Future<List<Conversation>> getConversations();
  Future<Conversation> getOrCreateSupportConversation();
  Future<Conversation> getOrCreateRideConversation({
    String? rideId,
    String? bookingId,
  });
  Future<List<ChatMessage>> getMessages(String conversationId);
  Future<ChatMessage> sendMessage(String conversationId, String content,
      {String type = 'text', List<String> attachments = const []});
  Future<void> markAsRead(String conversationId);
  WebSocketChannel? connectWebSocket(String conversationId, String token);
  Future<String> uploadAttachment(String filePath);
}

class ApiChatRepository implements ChatRepository {
  final ApiClient _client;

  ApiChatRepository(this._client);

  @override
  Future<List<Conversation>> getConversations() async {
    final response = await _client.get('/chats');
    final data = response.data;
    if (data is! List) return const [];
    final conversations = data
        .whereType<Map<String, dynamic>>()
        .map(Conversation.fromJson)
        .toList();
    final missingLastMessage =
        conversations.where((c) => c.lastMessage == null);
    if (missingLastMessage.isEmpty) {
      return conversations;
    }
    final enriched = await Future.wait(
      conversations.map((conversation) async {
        if (conversation.lastMessage != null) {
          return conversation;
        }
        try {
          final messages = await getMessages(conversation.id);
          if (messages.isEmpty) {
            return conversation;
          }
          return conversation.copyWith(
            lastMessage: messages.last,
            updatedAt: messages.last.createdAt,
          );
        } catch (_) {
          return conversation;
        }
      }),
    );
    enriched.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return enriched;
  }

  @override
  Future<Conversation> getOrCreateSupportConversation() async {
    final response = await _client.post('/chats/support');
    return Conversation.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<Conversation> getOrCreateRideConversation({
    String? rideId,
    String? bookingId,
  }) async {
    final response = await _client.post('/chats/ride', data: {
      if (rideId != null) 'ride_id': rideId,
      if (bookingId != null) 'booking_id': bookingId,
    });
    return Conversation.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<List<ChatMessage>> getMessages(String conversationId) async {
    final response = await _client.get('/chats/$conversationId/messages');
    final data = response.data;
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(ChatMessage.fromJson)
        .toList();
  }

  @override
  Future<ChatMessage> sendMessage(String conversationId, String content,
      {String type = 'text', List<String> attachments = const []}) async {
    final response = await _client.post(
      '/chats/$conversationId/messages',
      data: {
        'content': content,
        'message_type': type,
        'attachments': attachments,
      },
    );
    return ChatMessage.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> markAsRead(String conversationId) async {
    await _client.patch('/chats/$conversationId/read');
  }

  @override
  WebSocketChannel? connectWebSocket(String conversationId, String token) {
    final base = Uri.parse(_client.dio.options.baseUrl);
    final scheme = base.scheme == 'https' ? 'wss' : 'ws';
    final url = base.replace(
      scheme: scheme,
      path: '${base.path}/chats/ws/$conversationId',
      queryParameters: {'token': Uri.encodeQueryComponent(token)},
    );
    return WebSocketChannel.connect(url);
  }

  @override
  Future<String> uploadAttachment(String filePath) async {
    final file = await MultipartFile.fromFile(filePath);
    final formData = FormData.fromMap({'file': file});
    final response = await _client.post('/chats/attachments', data: formData);
    return (response.data as Map<String, dynamic>)['url'] as String;
  }
}

class MockChatRepository implements ChatRepository {
  static const Duration _latency = Duration(milliseconds: 250);

  final List<Conversation> _conversations = [];
  final Map<String, List<ChatMessage>> _messagesByConversation = {};

  @override
  Future<List<Conversation>> getConversations() async {
    await Future.delayed(_latency);
    return _conversations
        .map((c) => Conversation(
              id: c.id,
              type: c.type,
              rideId: c.rideId,
              bookingId: c.bookingId,
              status: c.status,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
              participants: c.participants,
              lastMessage: _lastMessageFor(c.id),
              unreadCount: c.unreadCount,
            ))
        .toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  @override
  Future<Conversation> getOrCreateSupportConversation() async {
    await Future.delayed(_latency);
    return _conversations.firstWhere(
      (c) => c.type == 'support',
      orElse: () {
        final c = Conversation(
          id: 'support-mock',
          type: 'support',
          status: 'open',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          participants: [
            ConversationParticipant(userId: 'mock-user', role: 'user')
          ],
          unreadCount: 0,
        );
        _conversations.add(c);
        return c;
      },
    );
  }

  @override
  Future<Conversation> getOrCreateRideConversation({
    String? rideId,
    String? bookingId,
  }) async {
    await Future.delayed(_latency);
    final key = bookingId ?? rideId ?? 'ride-mock';
    return _conversations.firstWhere(
      (c) => c.bookingId == bookingId || c.rideId == rideId,
      orElse: () {
        final c = Conversation(
          id: key,
          type: 'ride',
          rideId: rideId,
          bookingId: bookingId,
          status: 'open',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
          participants: [
            ConversationParticipant(userId: 'mock-user', role: 'passenger')
          ],
          unreadCount: 0,
        );
        _conversations.add(c);
        return c;
      },
    );
  }

  @override
  Future<List<ChatMessage>> getMessages(String conversationId) async {
    await Future.delayed(_latency);
    return List<ChatMessage>.from(
        _messagesByConversation[conversationId] ?? const []);
  }

  @override
  Future<ChatMessage> sendMessage(String conversationId, String content,
      {String type = 'text', List<String> attachments = const []}) async {
    await Future.delayed(_latency);
    final msg = ChatMessage(
      id: 'mock-${DateTime.now().microsecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: 'mock-user',
      senderName: 'Siz',
      content: content,
      messageType: type,
      attachments: attachments,
      createdAt: DateTime.now(),
      readAt: DateTime.now(),
    );
    _messagesByConversation.putIfAbsent(conversationId, () => []).add(msg);
    _touchConversation(conversationId, unreadCount: 0);
    return msg;
  }

  @override
  Future<void> markAsRead(String conversationId) async {
    await Future.delayed(_latency);
    _touchConversation(conversationId, unreadCount: 0);
  }

  @override
  WebSocketChannel? connectWebSocket(String conversationId, String token) =>
      null;

  @override
  Future<String> uploadAttachment(String filePath) async {
    await Future.delayed(_latency);
    return 'https://via.placeholder.com/300';
  }

  ChatMessage? _lastMessageFor(String conversationId) {
    final msgs = _messagesByConversation[conversationId];
    if (msgs == null || msgs.isEmpty) return null;
    return msgs.last;
  }

  void _touchConversation(String conversationId, {required int unreadCount}) {
    final i = _conversations.indexWhere((c) => c.id == conversationId);
    if (i == -1) return;
    final e = _conversations[i];
    _conversations[i] = Conversation(
      id: e.id,
      type: e.type,
      rideId: e.rideId,
      bookingId: e.bookingId,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: DateTime.now(),
      participants: e.participants,
      lastMessage: _lastMessageFor(conversationId),
      unreadCount: unreadCount,
    );
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  if (AuthMode.isApi) return ApiChatRepository(ref.watch(apiClientProvider));
  return MockChatRepository();
});
