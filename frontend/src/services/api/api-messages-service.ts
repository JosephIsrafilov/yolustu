import { apiClient } from '@/services/api-client';
import { Conversation, Message } from '@/types';
import {
  ChatMessagesParams,
  MessagesService,
  SendMessageInput,
} from '@/services/contracts/messages-service';

function buildMessagesQuery(params?: ChatMessagesParams): string {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.before) query.set('before', params.before);
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const apiMessagesService: MessagesService = {
  async getRideMessages(rideId: string) {
    return apiClient.get<Message[]>(`/messages/ride/${rideId}`);
  },

  async sendMessage(input: SendMessageInput) {
    return apiClient.post<Message>('/messages/', input);
  },

  async getChats() {
    return apiClient.get<Conversation[]>('/chats');
  },

  async getChat(conversationId: string) {
    return apiClient.get<Conversation>(`/chats/${conversationId}`);
  },

  async getChatMessages(conversationId: string, params?: ChatMessagesParams) {
    return apiClient.get<Message[]>(
      `/chats/${conversationId}/messages${buildMessagesQuery(params)}`,
    );
  },

  async createSupportChat() {
    return apiClient.post<Conversation>('/chats/support');
  },

  async createRideChat(bookingId: string) {
    return apiClient.post<Conversation>('/chats/ride', { booking_id: bookingId });
  },

  async sendChatMessage(conversationId: string, content: string) {
    return apiClient.post<Message>(`/chats/${conversationId}/messages`, { content });
  },

  async markChatRead(conversationId: string) {
    return apiClient.patch<{ ok: boolean }>(`/chats/${conversationId}/read`);
  },
};
