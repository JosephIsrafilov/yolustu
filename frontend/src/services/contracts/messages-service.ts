import { Conversation, Message } from '@/types';

export interface SendMessageInput {
  ride_id?: string;
  conversation_id?: string;
  content: string;
}

export interface ChatMessagesParams {
  limit?: number;
  before?: string;
}

export interface MessagesService {
  getRideMessages(rideId: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  getChats(): Promise<Conversation[]>;
  getChat(conversationId: string): Promise<Conversation>;
  getChatMessages(conversationId: string, params?: ChatMessagesParams): Promise<Message[]>;
  createSupportChat(): Promise<Conversation>;
  createRideChat(bookingId: string): Promise<Conversation>;
  sendChatMessage(conversationId: string, content: string): Promise<Message>;
  markChatRead(conversationId: string): Promise<{ ok: boolean }>;
}
