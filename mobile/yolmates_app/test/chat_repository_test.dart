import 'package:flutter_test/flutter_test.dart';
import 'package:yolmates_app/features/chat/data/chat_repository.dart';

void main() {
  group('MockChatRepository', () {
    test('getOrCreate creates new conversations when empty', () async {
      final repo = MockChatRepository();

      final support = await repo.getOrCreateSupportConversation();
      expect(support.type, 'support');

      final ride = await repo.getOrCreateRideConversation(rideId: 'ride-123');
      expect(ride.rideId, 'ride-123');

      final conversations = await repo.getConversations();
      expect(conversations, hasLength(2));
    });

    test('markAsRead and sendMessage update conversation state', () async {
      final repo = MockChatRepository();

      final ride = await repo.getOrCreateRideConversation(rideId: 'ride-123');
      final message = await repo.sendMessage(ride.id, 'On my way');
      final messages = await repo.getMessages(ride.id);

      var conversations = await repo.getConversations();
      var rideConversation = conversations.firstWhere((c) => c.id == ride.id);

      expect(messages.last.id, message.id);
      expect(rideConversation.lastMessage?.content, 'On my way');
      expect(rideConversation.unreadCount, 0);

      await repo.markAsRead(ride.id);
      conversations = await repo.getConversations();
      expect(
        conversations.firstWhere((c) => c.id == ride.id).unreadCount,
        0,
      );
    });
  });
}
