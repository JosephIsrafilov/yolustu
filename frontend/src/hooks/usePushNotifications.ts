import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { env } from '@/lib/env';

export interface PushNotification {
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export function usePushNotifications() {
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);
  const { isAuthenticated } = useAppStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || env.dataMode !== 'api') {
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

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      shouldReconnectRef.current = true;
      
      const wsUrl = `${env.wsUrl}/api/v1/notifications/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to push notifications');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'badge_unlocked') {
            setActiveToast({
              type: 'badge_unlocked',
              title: 'Təbriklər! Yeni nişan! / New Badge!',
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
                const store = useAppStore.getState();
                store.fetchBookings();
                store.fetchBookingRequests();
                store.fetchTrips();
              } else if (notificationType === 'new_message') {
                const rideId = data.data?.ride_id;
                if (typeof rideId === 'string') {
                  const store = useAppStore.getState();
                  const isCurrentChat = typeof window !== 'undefined' && 
                    (window.location.pathname === `/trips/${rideId}/chat` || 
                     window.location.pathname === `/trips/${rideId}/chat/`);
                  
                  if (!isCurrentChat) {
                    store.markRideAsUnread(rideId);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message', error);
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;

        if (!shouldReconnectRef.current) {
          return;
        }

        if (event.code === 1008) {
          shouldReconnectRef.current = false;
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          return;
        }

        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = () => {};

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return { activeToast, setActiveToast };
}
