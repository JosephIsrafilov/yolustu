import type { Conversation, ConversationParticipant, Message } from '@/types';

export type ChatConversation = Conversation;
export type ChatMessage = Message;
export type ChatParticipant = ConversationParticipant;

export function getOtherParticipant(
  conversation: ChatConversation,
  currentUserId?: string,
): ChatParticipant | null {
  if (conversation.type === 'support') return null;
  return (
    conversation.participants.find(
      (participant) => participant.user_id !== currentUserId,
    ) ?? null
  );
}

export function getConversationName(
  conversation: ChatConversation,
  currentUserId?: string,
  fallback = 'Chat',
): string {
  if (conversation.type === 'support') return 'Support';
  const other = getOtherParticipant(conversation, currentUserId);
  return other?.user_name?.trim() || fallback;
}

export function getConversationAvatar(
  conversation: ChatConversation,
  currentUserId?: string,
): string | undefined {
  return getOtherParticipant(conversation, currentUserId)?.user_avatar_url;
}

export function getMessageSenderLabel(
  message: ChatMessage,
  currentUserId?: string,
  fallback = 'User',
): string {
  if (message.sender_id === currentUserId) return 'You';
  return message.sender_name?.trim() || fallback;
}

export function sortConversationsByActivity(
  conversations: ChatConversation[],
): ChatConversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message?.created_at || a.updated_at;
    const bTime = b.last_message?.created_at || b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}
