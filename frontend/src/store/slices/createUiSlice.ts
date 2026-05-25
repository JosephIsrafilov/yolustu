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
  markRideAsRead: (rideId) =>
    set((state) => {
      const updated = { ...(state.unreadRides || {}) };
      delete updated[rideId];
      return { unreadRides: updated };
    }),
  markRideAsUnread: (rideId) =>
    set((state) => ({
      unreadRides: {
        ...(state.unreadRides || {}),
        [rideId]: true,
      },
    })),
});
