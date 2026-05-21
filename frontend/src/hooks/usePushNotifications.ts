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

  useEffect(() => {
    if (!isAuthenticated || env.dataMode !== 'api') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsUrl = `${env.wsUrl}/notifications/ws?token=${encodeURIComponent(token)}`;
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
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message', error);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected from push notifications. Reconnecting in 5s...');
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error', error);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
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
