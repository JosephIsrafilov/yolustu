import { apiClient } from '@/services/api-client';
import { Message } from '@/types';
import { MessagesService, SendMessageInput } from '@/services/contracts/messages-service';

export const apiMessagesService: MessagesService = {
  async getRideMessages(rideId: string) {
    return apiClient.get<Message[]>(`/messages/ride/${rideId}`);
  },

  async sendMessage(input: SendMessageInput) {
    return apiClient.post<Message>('/messages/', input);
  },
};
