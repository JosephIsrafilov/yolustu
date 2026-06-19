'use client';

import React from 'react';
import { buildApiWebSocketUrl } from '@/lib/env';
import { useAppStore } from '@/store/useAppStore';
import type { ChatConversation, ChatMessage } from './chat-models';
import { sortConversationsByActivity } from './chat-models';
import { chatRepository } from './chat-repository';

export function useChatConversations() {
  const [conversations, setConversations] = React.useState<ChatConversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatRepository.getConversations();
      setConversations(
        sortConversationsByActivity(
          data.filter((conversation) => conversation.type !== 'support'),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  return { conversations, loading, error, reload: load };
}

export function useChatConversation(conversationId: string) {
  const [conversation, setConversation] = React.useState<ChatConversation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    }, 0);

    chatRepository
      .getConversation(conversationId)
      .then((data) => {
        if (!cancelled) setConversation(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load chat');
        }
      })
      .finally(() => {
        clearTimeout(id);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [conversationId]);

  return { conversation, loading, error };
}

export function useChatMessages(conversationId: string) {
  const currentUser = useAppStore((state) => state.currentUser);
  const markChatAsRead = useAppStore((state) => state.markChatAsRead);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const socketRef = React.useRef<WebSocket | null>(null);
  const reconnectRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    }, 0);

    chatRepository
      .getMessages(conversationId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load messages');
        }
      })
      .finally(() => {
        clearTimeout(id);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [conversationId]);

  React.useEffect(() => {
    let closedByEffect = false;

    const connect = () => {
      if (!conversationId || closedByEffect) return;
      const socket = new WebSocket(buildApiWebSocketUrl(`/chats/ws/${conversationId}`));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const decoded = JSON.parse(event.data) as unknown;
          if (!decoded || typeof decoded !== 'object') return;
          const payload = decoded as ChatMessage | { data?: ChatMessage };
          const message = 'data' in payload && payload.data ? payload.data : payload;
          if (!('id' in message) || !message.id) return;
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          );
        } catch {
          // Ignore malformed socket payloads.
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (closedByEffect || reconnectAttemptsRef.current >= 8) return;
        const delayMs = Math.min(60000, 1000 * 2 ** reconnectAttemptsRef.current);
        reconnectAttemptsRef.current += 1;
        reconnectRef.current = setTimeout(connect, delayMs);
      };

      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [conversationId]);

  React.useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const hasUnreadIncoming = messages.some(
      (message) => message.sender_id !== currentUser.id && !message.read_at,
    );
    if (!hasUnreadIncoming) {
      markChatAsRead(conversationId);
      return;
    }

    let cancelled = false;
    chatRepository
      .markAsRead(conversationId)
      .then(() => {
        if (cancelled) return;
        markChatAsRead(conversationId);
        setMessages((current) =>
          current.map((message) =>
            message.sender_id !== currentUser.id && !message.read_at
              ? { ...message, read_at: new Date().toISOString() }
              : message,
          ),
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUser?.id, markChatAsRead, messages]);

  const sendMessage = React.useCallback(
    async (content: string) => {
      const body = content.trim();
      if (!body || sending) return;
      setSending(true);
      try {
        const message = await chatRepository.sendMessage(conversationId, body);
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending],
  );

  return {
    messages,
    loading,
    error,
    sending,
    isConnected,
    sendMessage,
  };
}
