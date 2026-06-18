import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { buildApiWebSocketUrl, normalizeWebSocketBaseUrl } from '@/lib/env';
import { useChat } from '@/hooks/useChat';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Jest hoists mock factories, so these shared mock bindings need var semantics.
// eslint-disable-next-line no-var
var mockRefreshFns = {
  fetchBookings: jest.fn(),
  fetchBookingRequests: jest.fn(),
  fetchTrips: jest.fn(),
  initAuth: jest.fn(),
  markRideAsUnread: jest.fn(),
  markChatAsUnread: jest.fn(),
};

// eslint-disable-next-line no-var
var mockStoreState = {
  isAuthenticated: true,
  authStatus: 'authenticated',
  currentUser: { id: 'u-1' },
  ...mockRefreshFns,
};

jest.mock('@/store/useAppStore', () => {
  const useAppStore = jest.fn(
    (selector?: (state: unknown) => unknown) =>
      selector ? selector(mockStoreState) : mockStoreState
  ) as jest.Mock & { getState: () => typeof mockStoreState };
  useAppStore.getState = () => mockStoreState;
  return { useAppStore };
});

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.({ code: 1000 });
  }
}

function ChatHarness() {
  useChat('ride-1');
  return null;
}

function PushHarness() {
  usePushNotifications();
  return null;
}

describe('websocket reliability helpers', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    Object.values(mockRefreshFns).forEach((fn) => fn.mockClear());
    mockStoreState = {
      isAuthenticated: true,
      authStatus: 'authenticated',
      currentUser: { id: 'u-1' },
      ...mockRefreshFns,
    };
    jest.spyOn(Storage.prototype, 'getItem');
    (globalThis as { WebSocket?: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
  });

  it('normalizes websocket URLs without duplicating api prefix', () => {
    expect(normalizeWebSocketBaseUrl('ws://localhost:8000/api/v1')).toBe(
      'ws://localhost:8000'
    );
    expect(buildApiWebSocketUrl('/api/v1/messages/ws/ride-1')).toBe(
      'ws://localhost:8000/api/v1/messages/ws/ride-1'
    );
  });

  it('opens chat websocket without legacy localStorage token dependency', async () => {
    render(<ChatHarness />);

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    expect(MockWebSocket.instances[0].url).toContain('/api/v1/messages/ws/ride-1');
    expect(MockWebSocket.instances[0].url).not.toContain('token=');
    expect(window.localStorage.getItem).not.toHaveBeenCalled();
  });

  it('refreshes canonical data when notification socket opens and window refocuses', async () => {
    render(<PushHarness />);

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    expect(mockRefreshFns.initAuth).not.toHaveBeenCalled();
    MockWebSocket.instances[0].onopen?.();
    window.dispatchEvent(new Event('focus'));

    expect(mockRefreshFns.fetchBookings).toHaveBeenCalledTimes(2);
    expect(mockRefreshFns.fetchBookingRequests).toHaveBeenCalledTimes(2);
    expect(mockRefreshFns.fetchTrips).toHaveBeenCalledTimes(2);
  });

  it('marks conversation chats unread from message notifications', async () => {
    render(<PushHarness />);

    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1));
    await act(async () => {
      MockWebSocket.instances[0].onmessage?.({
        data: JSON.stringify({
          type: 'notification',
          title: 'New message',
          body: 'Hello',
          data: {
            type: 'new_message',
            conversation_id: 'conversation-1',
          },
        }),
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockRefreshFns.markChatAsUnread).toHaveBeenCalledWith('conversation-1');
      expect(mockRefreshFns.markRideAsUnread).not.toHaveBeenCalled();
    });
  });
});
