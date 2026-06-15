import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/network/providers.dart';
import '../../auth/data/auth_mode.dart';
import 'chat_models.dart';

abstract class ChatRepository {
  Future<List<Conversation>> getConversations();
  Future<Conversation> getOrCreateSupportConversation();
  Future<Conversation> getOrCreateRideConversation(String bookingId);
  Future<List<ChatMessage>> getMessages(String conversationId);
  Future<ChatMessage> sendMessage(String conversationId, String content, {String type = 'text', List<String> attachments = const []});
  Future<void> markAsRead(String conversationId);
  WebSocketChannel? connectWebSocket(String conversationId, String token);
}

class ApiChatRepository implements ChatRepository {
  final Dio _dio;
  
  ApiChatRepository(this._dio);

  @override
  Future<List<Conversation>> getConversations() async {
    final response = await _dio.get('/chats');
    return (response.data as List).map((e) => Conversation.fromJson(e)).toList();
  }

  @override
  Future<Conversation> getOrCreateSupportConversation() async {
    final response = await _dio.post('/chats/support');
    return Conversation.fromJson(response.data);
  }

  @override
  Future<Conversation> getOrCreateRideConversation(String bookingId) async {
    final response = await _dio.post('/chats/ride', data: {'booking_id': bookingId});
    return Conversation.fromJson(response.data);
  }

  @override
  Future<List<ChatMessage>> getMessages(String conversationId) async {
    final response = await _dio.get('/chats/$conversationId/messages');
    return (response.data as List).map((e) => ChatMessage.fromJson(e)).toList();
  }

  @override
  Future<ChatMessage> sendMessage(String conversationId, String content, {String type = 'text', List<String> attachments = const []}) async {
    final response = await _dio.post(
      '/chats/$conversationId/messages',
      data: {
        'content': content,
        'message_type': type,
        'attachments': attachments,
      },
    );
    return ChatMessage.fromJson(response.data);
  }

  @override
  Future<void> markAsRead(String conversationId) async {
    await _dio.patch('/chats/$conversationId/read');
  }

  @override
  WebSocketChannel? connectWebSocket(String conversationId, String token) {
    // Assuming backend is at ws://10.0.2.2:8000/api/v1/chats/ws/{id}?token={token}
    // We get baseUrl from Dio and replace http with ws.
    final baseUrl = _dio.options.baseUrl.replaceFirst('http', 'ws');
    final url = '$baseUrl/chats/ws/$conversationId?token=$token';
    return WebSocketChannel.connect(Uri.parse(url));
  }
}

class MockChatRepository implements ChatRepository {
  static const Duration _latency = Duration(milliseconds: 250);

  final List<Conversation> _conversations = [];
  final Map<String, List<ChatMessage>> _messagesByConversation = {};

  MockChatRepository() {
    final now = DateTime.now();
    final supportConversation = Conversation(
      id: 'support-1',
      type: 'support',
      status: 'open',
      createdAt: now.subtract(const Duration(days: 2)),
      updatedAt: now.subtract(const Duration(minutes: 40)),
      participants: [
        ConversationParticipant(userId: 'mock-user', role: 'user'),
      ],
      unreadCount: 1,
    );
    final rideConversation = Conversation(
      id: 'ride-1',
      type: 'ride',
      rideId: 'ride-1',
      bookingId: 'booking-1',
      status: 'open',
      createdAt: now.subtract(const Duration(days: 1)),
      updatedAt: now.subtract(const Duration(minutes: 10)),
      participants: [
        ConversationParticipant(userId: 'mock-user', role: 'passenger'),
        ConversationParticipant(userId: 'driver-1', role: 'driver'),
      ],
      unreadCount: 2,
    );

    _conversations.addAll([rideConversation, supportConversation]);
    _messagesByConversation.addAll({
      supportConversation.id: [
        ChatMessage(
          id: 'support-msg-1',
          conversationId: supportConversation.id,
          senderId: 'support-agent',
          senderName: 'Yolmates Dəstək',
          content: 'Salam, sizə necə kömək edə bilərik?',
          messageType: 'text',
          createdAt: now.subtract(const Duration(minutes: 40)),
        ),
      ],
      rideConversation.id: [
        ChatMessage(
          id: 'ride-msg-1',
          conversationId: rideConversation.id,
          rideId: 'ride-1',
          senderId: 'driver-1',
          senderName: 'Elvin',
          content: 'Salam, yola 10 dəqiqəyə çıxıram.',
          messageType: 'text',
          createdAt: now.subtract(const Duration(minutes: 12)),
        ),
        ChatMessage(
          id: 'ride-msg-2',
          conversationId: rideConversation.id,
          rideId: 'ride-1',
          senderId: 'driver-1',
          senderName: 'Elvin',
          content: 'Mərkəzi avtovağzalın qarşısında gözləyəcəyəm.',
          messageType: 'text',
          createdAt: now.subtract(const Duration(minutes: 10)),
        ),
      ],
    });
  }

  @override
  Future<List<Conversation>> getConversations() async {
    await Future.delayed(_latency);
    return _conversations
        .map(
          (conversation) => Conversation(
            id: conversation.id,
            type: conversation.type,
            rideId: conversation.rideId,
            bookingId: conversation.bookingId,
            status: conversation.status,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            participants: conversation.participants,
            lastMessage: _lastMessageFor(conversation.id),
            unreadCount: conversation.unreadCount,
          ),
        )
        .toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
  }

  @override
  Future<Conversation> getOrCreateSupportConversation() async {
    await Future.delayed(_latency);
    return _conversations.firstWhere((conversation) => conversation.type == 'support');
  }

  @override
  Future<Conversation> getOrCreateRideConversation(String bookingId) async {
    await Future.delayed(_latency);
    return _conversations.firstWhere((conversation) => conversation.bookingId == bookingId);
  }

  @override
  Future<List<ChatMessage>> getMessages(String conversationId) async {
    await Future.delayed(_latency);
    return List<ChatMessage>.from(_messagesByConversation[conversationId] ?? const []);
  }

  @override
  Future<ChatMessage> sendMessage(
    String conversationId,
    String content, {
    String type = 'text',
    List<String> attachments = const [],
  }) async {
    await Future.delayed(_latency);
    final message = ChatMessage(
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
    final messages = _messagesByConversation.putIfAbsent(conversationId, () => []);
    messages.add(message);
    _touchConversation(conversationId, unreadCount: 0);
    return message;
  }

  @override
  Future<void> markAsRead(String conversationId) async {
    await Future.delayed(_latency);
    _touchConversation(conversationId, unreadCount: 0);
  }

  @override
  WebSocketChannel? connectWebSocket(String conversationId, String token) => null;

  ChatMessage? _lastMessageFor(String conversationId) {
    final messages = _messagesByConversation[conversationId];
    if (messages == null || messages.isEmpty) return null;
    return messages.last;
  }

  void _touchConversation(String conversationId, {required int unreadCount}) {
    final index = _conversations.indexWhere((conversation) => conversation.id == conversationId);
    if (index == -1) return;
    final existing = _conversations[index];
    _conversations[index] = Conversation(
      id: existing.id,
      type: existing.type,
      rideId: existing.rideId,
      bookingId: existing.bookingId,
      status: existing.status,
      createdAt: existing.createdAt,
      updatedAt: DateTime.now(),
      participants: existing.participants,
      lastMessage: _lastMessageFor(conversationId),
      unreadCount: unreadCount,
    );
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  if (AuthMode.isApi) {
    return ApiChatRepository(ref.watch(apiClientProvider).dio);
  }
  return MockChatRepository();
});
