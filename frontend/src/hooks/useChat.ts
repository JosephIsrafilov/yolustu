'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { buildApiWebSocketUrl } from '@/lib/env';
import { Message } from '@/types';

type ChatSocketMode = 'ride' | 'conversation';

export function useChat(id: string, mode: ChatSocketMode = 'ride') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!id) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsPath = mode === 'conversation' ? `/chats/ws/${id}` : `/messages/ws/${id}`;
    const wsUrl = buildApiWebSocketUrl(wsPath);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data) as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      } catch {
        // Ignore malformed payloads.
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      socketRef.current = null;
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 3000);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [id, mode]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectRef.current = connect;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  return {
    messages,
    setMessages,
    isConnected,
    addMessage,
  };
}
