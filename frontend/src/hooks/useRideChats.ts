'use client';

import React from 'react';
import { messagesService } from '@/services';
import { Conversation } from '@/types';

export function useRideChats(enabled = true) {
  const [rideChats, setRideChats] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(enabled);

  React.useEffect(() => {
    if (!enabled) {
      const id = setTimeout(() => {
        setRideChats([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);

    messagesService
      .getChats()
      .then((conversations) => {
        if (!cancelled) {
          setRideChats(conversations.filter((conversation) => conversation.type === 'ride'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRideChats([]);
        }
      })
      .finally(() => {
        clearTimeout(id);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const getRideChatByBookingId = (bookingId: string) =>
    rideChats.find((conversation) => conversation.booking_id === bookingId);

  const getRideChatsByRideId = (rideId: string) =>
    rideChats.filter((conversation) => conversation.ride_id === rideId);

  const upsertRideChat = (conversation: Conversation) => {
    setRideChats((current) => {
      const filtered = current.filter((item) => item.id !== conversation.id);
      return [conversation, ...filtered];
    });
  };

  return {
    rideChats,
    loading,
    getRideChatByBookingId,
    getRideChatsByRideId,
    upsertRideChat,
  };
}
