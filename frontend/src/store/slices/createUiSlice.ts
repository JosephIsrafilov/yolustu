import { StateCreator } from 'zustand';
import { AppState, UiSlice } from '../types';

export const createUiSlice: StateCreator<
  AppState,
  [],
  [],
  UiSlice
> = (set) => ({
  language: 'az',
  setLanguage: (language) => set({ language }),
  unreadRides: {},
  unreadChats: {},
  markRideAsRead: (rideId) =>
    set((state) => {
      const updated = { ...state.unreadRides };
      delete updated[rideId];
      return { unreadRides: updated };
    }),
  markRideAsUnread: (rideId) =>
    set((state) => ({
      unreadRides: {
        ...state.unreadRides,
        [rideId]: true,
      },
    })),
  markChatAsRead: (conversationId) =>
    set((state) => {
      const updated = { ...state.unreadChats };
      delete updated[conversationId];
      return { unreadChats: updated };
    }),
  markChatAsUnread: (conversationId) =>
    set((state) => ({
      unreadChats: {
        ...state.unreadChats,
        [conversationId]: true,
      },
    })),
});
