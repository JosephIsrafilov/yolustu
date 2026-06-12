import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Conversation summary for the messages list (mock).
class Conversation {
  final String id;
  final String name;
  final String lastMessage;
  final String time;
  final int unread;

  const Conversation({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.time,
    this.unread = 0,
  });
}

/// Seeded conversations; backend swap point.
///
/// Replace [MockChatRepository] with an API/WS-backed implementation later;
/// the UI only depends on [conversationsProvider].
final conversationsProvider = Provider<List<Conversation>>((ref) {
  return const [
    Conversation(
      id: 'conv-0',
      name: 'Rəşad Süleymanov',
      lastMessage: 'Salam, sabah saat 8-də çıxırıq.',
      time: '09:30',
      unread: 2,
    ),
    Conversation(
      id: 'conv-1',
      name: 'Aysel Məmmədova',
      lastMessage: 'Yerinizi təsdiqlədim, görüşənədək!',
      time: '08:15',
      unread: 1,
    ),
    Conversation(
      id: 'conv-2',
      name: 'Elçin Hüseynov',
      lastMessage: 'Baqaj üçün yer var, narahat olmayın.',
      time: 'Dünən',
    ),
    Conversation(
      id: 'conv-3',
      name: 'Nigar Əliyeva',
      lastMessage: 'Təşəkkürlər, rahat səyahət idi.',
      time: 'Dünən',
    ),
  ];
});
