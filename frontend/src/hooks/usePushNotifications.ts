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
  const [activeToast, setActiveToast] = useState<{ title: string; body: string } | null>(null);
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
          if (data.type === 'notification') {
            setActiveToast({ title: data.title, body: data.body });
            
            if (toastTimeoutRef.current) {
              clearTimeout(toastTimeoutRef.current);
            }
            toastTimeoutRef.current = setTimeout(() => {
              setActiveToast(null);
            }, 5000);

            // Trigger live UI refresh if it's a booking event
            if (data.data?.type?.startsWith('booking_')) {
              const store = useAppStore.getState();
              store.fetchBookings();
              store.fetchBookingRequests();
              store.fetchTrips();
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

      ws.onerror = () => {
        // Let onclose decide whether this was a real disconnect worth reconnecting.
      };

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
