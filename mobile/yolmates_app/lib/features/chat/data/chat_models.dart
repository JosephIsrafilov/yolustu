class ConversationParticipant {
  final String userId;
  final String role;

  ConversationParticipant({required this.userId, required this.role});

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    return ConversationParticipant(
      userId: json['user_id'] as String,
      role: json['role'] as String,
    );
  }
}

class Conversation {
  final String id;
  final String type; // 'ride' or 'support'
  final String? rideId;
  final String? bookingId;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ConversationParticipant> participants;

  // Appended locally for UI display
  final ChatMessage? lastMessage;
  final int unreadCount;

  Conversation({
    required this.id,
    required this.type,
    this.rideId,
    this.bookingId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      type: json['type'] as String,
      rideId: json['ride_id'] as String?,
      bookingId: json['booking_id'] as String?,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => ConversationParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ChatMessage {
  final String id;
  final String? conversationId;
  final String? rideId;
  final String senderId;
  final String senderName;
  final String content;
  final String messageType; // 'text', 'photo', 'audio', 'call'
  final List<String> attachments;
  final DateTime createdAt;
  final DateTime? readAt;

  ChatMessage({
    required this.id,
    this.conversationId,
    this.rideId,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.messageType,
    this.attachments = const [],
    required this.createdAt,
    this.readAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      conversationId: json['conversation_id'] as String?,
      rideId: json['ride_id'] as String?,
      senderId: json['sender_id'] as String,
      senderName: json['sender_name'] as String,
      content: json['content'] as String,
      messageType: json['message_type'] as String? ?? 'text',
      attachments: (json['attachments'] as List<dynamic>?)?.map((e) => e as String).toList() ?? [],
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at'] as String).toLocal() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'content': content,
      'message_type': messageType,
      'attachments': attachments,
    };
  }
}
