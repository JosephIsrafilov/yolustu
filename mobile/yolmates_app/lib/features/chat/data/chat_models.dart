class ConversationParticipant {
  final String userId;
  final String role;
  final String userName;
  final String? userAvatarUrl;

  ConversationParticipant({
    required this.userId,
    required this.role,
    this.userName = 'User',
    this.userAvatarUrl,
  });

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    return ConversationParticipant(
      userId: json['user_id'] as String,
      role: json['role'] as String,
      userName: json['user_name'] as String? ?? 'User',
      userAvatarUrl: json['user_avatar_url'] as String?,
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

  Conversation copyWith({
    String? id,
    String? type,
    String? rideId,
    String? bookingId,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<ConversationParticipant>? participants,
    ChatMessage? lastMessage,
    int? unreadCount,
  }) {
    return Conversation(
      id: id ?? this.id,
      type: type ?? this.type,
      rideId: rideId ?? this.rideId,
      bookingId: bookingId ?? this.bookingId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }

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
              ?.map((e) =>
                  ConversationParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lastMessage: json['last_message'] is Map<String, dynamic>
          ? ChatMessage.fromJson(json['last_message'] as Map<String, dynamic>)
          : null,
      unreadCount: (json['unread_count'] as num?)?.toInt() ?? 0,
    );
  }

  String getOtherParticipantName(String currentUserId) {
    if (type == 'support') return '';
    try {
      final other = participants.firstWhere((p) => p.userId != currentUserId);
      return other.userName;
    } catch (_) {
      return '';
    }
  }

  String? getOtherParticipantAvatar(String currentUserId) {
    if (type == 'support') return null;
    try {
      final other = participants.firstWhere((p) => p.userId != currentUserId);
      return other.userAvatarUrl;
    } catch (_) {
      return null;
    }
  }

  ConversationParticipant? getOtherParticipant(String currentUserId) {
    if (type == 'support') return null;
    try {
      return participants.firstWhere((p) => p.userId != currentUserId);
    } catch (_) {
      return null;
    }
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
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      readAt: json['read_at'] != null
          ? DateTime.parse(json['read_at'] as String).toLocal()
          : null,
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
