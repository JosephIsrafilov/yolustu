import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChatPanel from '@/components/chat/ChatPanel';

const addMessage = jest.fn();
const setMessages = jest.fn();
const markChatRead = jest.fn();
const getChatMessages = jest.fn();
const sendChatMessage = jest.fn();
const markChatAsRead = jest.fn();

jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    messages: [
      {
        id: 'message-1',
        conversation_id: 'conversation-1',
        sender_id: 'other-user',
        sender_name: 'Other User',
        content: '',
        message_type: 'photo',
        attachments: ['https://cdn.example.com/photo.jpg'],
        created_at: '2026-06-18T12:00:00Z',
      },
    ],
    setMessages,
    isConnected: true,
    addMessage,
  })),
}));

jest.mock('@/services', () => ({
  messagesService: {
    getChatMessages: (...args: unknown[]) => getChatMessages(...args),
    sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
    markChatRead: (...args: unknown[]) => markChatRead(...args),
  },
}));

jest.mock('@/store/useAppStore', () => ({
  useAppStore: jest.fn((selector?: (state: unknown) => unknown) =>
    selector
      ? selector({
          currentUser: { id: 'current-user' },
          language: 'en',
          markChatAsRead,
        })
      : null,
  ),
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getChatMessages.mockResolvedValue([]);
    markChatRead.mockResolvedValue({ ok: true });
    sendChatMessage.mockResolvedValue({
      id: 'message-2',
      conversation_id: 'conversation-1',
      sender_id: 'current-user',
      content: 'Hello',
      created_at: '2026-06-18T12:01:00Z',
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    });
  });

  it('marks incoming messages as read and renders image attachments', async () => {
    render(<ChatPanel conversationId="conversation-1" />);

    expect(await screen.findByAltText('Attachment 1')).toBeInTheDocument();

    await waitFor(() => expect(markChatRead).toHaveBeenCalledWith('conversation-1'));
    await waitFor(() => expect(markChatAsRead).toHaveBeenCalledWith('conversation-1'));
  });
});
