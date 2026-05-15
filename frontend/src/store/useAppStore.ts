

'use client';

import { create } from 'zustand';
import { AppState } from './types';
import { createAuthSlice } from './slices/createAuthSlice';
import { createTripSlice } from './slices/createTripSlice';
import { createBookingSlice } from './slices/createBookingSlice';
import { createReviewSlice } from './slices/createReviewSlice';

export const useAppStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createTripSlice(...a),
  ...createBookingSlice(...a),
  ...createReviewSlice(...a),
}));

export * from './types';
