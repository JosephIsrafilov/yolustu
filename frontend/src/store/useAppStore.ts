'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState } from './types';
import { createAuthSlice } from './slices/createAuthSlice';
import { createTripSlice } from './slices/createTripSlice';
import { createBookingSlice } from './slices/createBookingSlice';
import { createReviewSlice } from './slices/createReviewSlice';
import { createUiSlice } from './slices/createUiSlice';

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createTripSlice(...a),
      ...createBookingSlice(...a),
      ...createReviewSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'yolustu-storage',
      version: 2,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        activeRole: state.activeRole,
        activeMode: state.activeMode,
        language: state.language,
        unreadRides: state.unreadRides,
      }),
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown> | null;
        if (!state) return state;

        if (!state.activeMode && state.activeRole) {
          return {
            ...state,
            activeMode: state.activeRole,
          };
        }

        return state;
      },
    }
  )
);

export * from './types';
