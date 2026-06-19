'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { buildApiWebSocketUrl } from '@/lib/env';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrackingState {
  route: LatLng[];
  position: LatLng | null;
  heading: number;
  progress: number;
  status: string;
  isConnected: boolean;
}

type RouteMessage = {
  type: 'route';
  origin: LatLng;
  destination: LatLng;
  path: LatLng[];
};
type LocationMessage = {
  type: 'location';
  lat: number;
  lng: number;
  heading: number;
  progress: number;
};
type StatusMessage = { type: 'status'; status: string };
type TrackingMessage = RouteMessage | LocationMessage | StatusMessage;

export function useTracking(
  rideId: string | null,
  opts: { shareToken?: string; token?: string } = {},
) {
  const { shareToken, token } = opts;
  const [state, setState] = useState<TrackingState>({
    route: [],
    position: null,
    heading: 0,
    progress: 0,
    status: 'connecting',
    isConnected: false,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!rideId) return;
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }

    const params = new URLSearchParams();
    if (shareToken) params.set('share_token', shareToken);
    if (token) params.set('token', token);
    const query = params.toString();
    const wsUrl = buildApiWebSocketUrl(`/ws/tracking/${rideId}${query ? `?${query}` : ''}`);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setState((s) => ({ ...s, isConnected: true, status: s.status === 'connecting' ? 'live' : s.status }));
    };

    socket.onmessage = (event) => {
      let msg: TrackingMessage;
      try {
        msg = JSON.parse(event.data) as TrackingMessage;
      } catch {
        return;
      }
      setState((s) => {
        if (msg.type === 'route') {
          return { ...s, route: msg.path, status: 'live' };
        }
        if (msg.type === 'location') {
          return {
            ...s,
            position: { lat: msg.lat, lng: msg.lng },
            heading: msg.heading,
            progress: msg.progress,
            status: 'live',
          };
        }
        if (msg.type === 'status') {
          return { ...s, status: msg.status };
        }
        return s;
      });
    };

    socket.onclose = () => {
      setState((s) => ({ ...s, isConnected: false }));
      socketRef.current = null;
      if (shouldReconnectRef.current) {
        reconnectRef.current = setTimeout(() => connectRef.current(), 3000);
      }
    };

    socket.onerror = () => socket.close();
  }, [rideId, shareToken, token]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectRef.current = connect;
    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  useEffect(() => {
    if (state.status === 'completed' || state.status === 'ended') {
      shouldReconnectRef.current = false;
    }
  }, [state.status]);

  return state;
}
