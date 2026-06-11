import { StateCreator } from 'zustand';
import { AppState, ReviewSlice } from '../types';
import { reviewsService } from '@/services';

export const createReviewSlice: StateCreator<
  AppState,
  [],
  [],
  ReviewSlice
> = (set) => ({
  reviews: [],

  fetchReviews: async (targetUserId) => {
    try {
      const reviews = await reviewsService.getReviewsForUser(targetUserId);
      set({ reviews });
    } catch (error) {
      // Error handled silently
    }
  },

  createReview: async (data) => {
    try {
      const review = await reviewsService.createReview(data);
      set((state) => ({
        reviews: [review, ...state.reviews],
      }));
      return true;
    } catch (error) {
      // Error handled silently
      return false;
    }
  },
});
