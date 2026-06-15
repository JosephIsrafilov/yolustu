import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/chat/data/chat_repository.dart';

void main() {
  group('MockChatRepository', () {
    test('returns sorted seeded conversations with unread counts', () async {
      final repo = MockChatRepository();

      final conversations = await repo.getConversations();

      expect(conversations, hasLength(2));
      expect(conversations.first.updatedAt.isAfter(conversations.last.updatedAt), isTrue);
      expect(conversations.first.unreadCount, greaterThan(0));
      expect(conversations.first.lastMessage, isNotNull);
    });

    test('markAsRead and sendMessage update conversation state', () async {
      final repo = MockChatRepository();

      await repo.markAsRead('ride-1');
      var conversations = await repo.getConversations();
      expect(
        conversations.firstWhere((conversation) => conversation.id == 'ride-1').unreadCount,
        0,
      );

      final message = await repo.sendMessage('ride-1', 'On my way');
      final messages = await repo.getMessages('ride-1');
      conversations = await repo.getConversations();
      final rideConversation =
          conversations.firstWhere((conversation) => conversation.id == 'ride-1');

      expect(messages.last.id, message.id);
      expect(rideConversation.lastMessage?.content, 'On my way');
      expect(rideConversation.unreadCount, 0);
    });
  });
}
