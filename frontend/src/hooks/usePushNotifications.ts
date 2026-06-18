import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { buildApiWebSocketUrl } from '@/lib/env';

export interface PushNotification {
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export function usePushNotifications() {
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const authStatus = useAppStore((state) => state.authStatus);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authStatus !== 'authenticated') {
      shouldReconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    const refreshCanonicalData = () => {
      const store = useAppStore.getState();
      void store.fetchBookings();
      void store.fetchBookingRequests();
      void store.fetchTrips();
    };

    const connectWebSocket = () => {
      const latestState = useAppStore.getState();
      if (!latestState.isAuthenticated || !latestState.currentUser) {
        shouldReconnectRef.current = false;
        return;
      }

      shouldReconnectRef.current = true;
      
      const wsUrl = buildApiWebSocketUrl('/notifications/ws');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        refreshCanonicalData();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'badge_unlocked') {
            setActiveToast({
              type: 'badge_unlocked',
              title: 'New badge unlocked',
              body: `You unlocked: ${data.badge?.name}`,
              data: { badge: data.badge }
            });
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setActiveToast(null), 8000);
          } else if (data.type === 'notification') {
            setActiveToast(data);
            
            if (toastTimeoutRef.current) {
              clearTimeout(toastTimeoutRef.current);
            }
            toastTimeoutRef.current = setTimeout(() => {
              setActiveToast(null);
            }, 8000); // Give users slightly more time to click action buttons

            // Trigger live UI refresh if it's a booking event
            const notificationType = data.data?.type;
            if (typeof notificationType === 'string') {
              if (notificationType.startsWith('booking_')) {
                refreshCanonicalData();
              } else if (notificationType === 'new_message') {
                const conversationId = data.data?.conversation_id;
                const rideId = data.data?.ride_id;
                const store = useAppStore.getState();

                if (typeof conversationId === 'string') {
                  const isCurrentChat =
                    typeof window !== 'undefined' &&
                    (window.location.pathname === `/chats/${conversationId}` ||
                      window.location.pathname === `/chats/${conversationId}/`);

                  if (!isCurrentChat) {
                    store.markChatAsUnread(conversationId);
                  }
                } else if (typeof rideId === 'string') {
                  const isCurrentLegacyChat =
                    typeof window !== 'undefined' &&
                    (window.location.pathname === `/trips/${rideId}/chat` ||
                      window.location.pathname === `/trips/${rideId}/chat/`);

                  if (!isCurrentLegacyChat) {
                    store.markRideAsUnread(rideId);
                  }
                }
              }
            }
          }
        } catch (error) {
          // Error handled silently
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;

        if (!shouldReconnectRef.current) {
          return;
        }

        if (event.code === 1008) {
          shouldReconnectRef.current = false;
          return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = (event) => {
        console.debug('[WebSocket] Notification connection error', event);
      };

      wsRef.current = ws;
    };

    connectWebSocket();
    const handleFocus = () => {
      refreshCanonicalData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      shouldReconnectRef.current = false;
      window.removeEventListener('focus', handleFocus);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, authStatus]);

  return { activeToast, setActiveToast };
}
