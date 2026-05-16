import { Message } from '@/types';

export interface SendMessageInput {
  ride_id: string;
  content: string;
}

export interface MessagesService {
  getRideMessages(rideId: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
}
