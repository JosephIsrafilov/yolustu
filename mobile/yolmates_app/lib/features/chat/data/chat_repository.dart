import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../../../core/network/providers.dart';
import '../../auth/state/auth_controller.dart';
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

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ApiChatRepository(ref.watch(apiClientProvider).dio);
});
