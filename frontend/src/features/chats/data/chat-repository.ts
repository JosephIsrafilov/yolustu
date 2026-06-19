import { messagesService } from '@/services';
import type { ChatConversation, ChatMessage } from './chat-models';

export interface ChatRepository {
  getConversations(): Promise<ChatConversation[]>;
  getConversation(conversationId: string): Promise<ChatConversation>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, content: string): Promise<ChatMessage>;
  markAsRead(conversationId: string): Promise<void>;
  getOrCreateSupportConversation(): Promise<ChatConversation>;
  getOrCreateRideConversation(bookingId: string): Promise<ChatConversation>;
}

export const apiChatRepository: ChatRepository = {
  async getConversations() {
    const conversations = await messagesService.getChats();
    return Promise.all(
      conversations.map(async (conversation) => {
        if (conversation.last_message) return conversation;
        try {
          const messages = await messagesService.getChatMessages(conversation.id, {
            limit: 50,
          });
          const lastMessage = messages[messages.length - 1];
          return lastMessage
            ? {
                ...conversation,
                last_message: lastMessage,
                updated_at: lastMessage.created_at,
              }
            : conversation;
        } catch {
          return conversation;
        }
      }),
    );
  },

  async getConversation(conversationId) {
    return messagesService.getChat(conversationId);
  },

  async getMessages(conversationId) {
    return messagesService.getChatMessages(conversationId, { limit: 50 });
  },

  async sendMessage(conversationId, content) {
    return messagesService.sendChatMessage(conversationId, content);
  },

  async markAsRead(conversationId) {
    await messagesService.markChatRead(conversationId);
  },

  async getOrCreateSupportConversation() {
    return messagesService.createSupportChat();
  },

  async getOrCreateRideConversation(bookingId) {
    return messagesService.createRideChat(bookingId);
  },
};

export const chatRepository: ChatRepository = apiChatRepository;
