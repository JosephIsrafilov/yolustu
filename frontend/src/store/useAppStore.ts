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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        activeRole: state.activeRole,
        language: state.language,
      }),
    }
  )
);

export * from './types';
