'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { env } from '@/lib/env';
import { Message } from '@/types';

export function useChat(rideId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!rideId) return;

    const wsUrl = `${env.wsUrl}/messages/ws/${rideId}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to chat:', rideId);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data) as Message;
        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('Failed to parse chat message:', err);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from chat:', rideId);
      setIsConnected(false);
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      socket.close();
    };
  }, [rideId]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    setMessages,
    isConnected,
    addMessage
  };
}
