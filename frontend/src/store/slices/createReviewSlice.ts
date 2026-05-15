import { StateCreator } from 'zustand';
import { AppState, ReviewSlice } from '../types';
import { MOCK_REVIEWS } from '@/data/mock-data';
import { generateId } from '@/lib/utils';
import type { Review } from '@/types';

export const createReviewSlice: StateCreator<
  AppState,
  [],
  [],
  ReviewSlice
> = (set, get) => ({
  reviews: [...MOCK_REVIEWS],

  createReview: (data) => {
    const { currentUser, trips, users, reviews, bookings } = get();
    if (!currentUser) {
      set({ lastError: 'Rəy yazmaq üçün daxil olun.' });
      return false;
    }
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      set({ lastError: 'Reytinq 1-5 arasında olmalıdır.' });
      return false;
    }
    const trip = trips.find((t) => t.id === data.tripId);
    if (!trip) {
      set({ lastError: 'Gediş tapılmadı.' });
      return false;
    }
    const targetUser = users.find((u) => u.id === data.targetUserId);
    if (!targetUser) {
      set({ lastError: 'Qiymətləndiriləcək istifadəçi tapılmadı.' });
      return false;
    }
    const completedBooking = bookings.find((b) =>
      b.tripId === data.tripId &&
      b.passengerId === currentUser.id &&
      b.status === 'completed',
    );
    if (trip.status !== 'completed' || !completedBooking) {
      set({ lastError: 'Rəy yalnız tamamlanmış rezervdən sonra yazıla bilər.' });
      return false;
    }
    const duplicateReview = reviews.some((r) =>
      r.authorId === currentUser.id &&
      r.tripId === data.tripId &&
      r.targetUserId === data.targetUserId,
    );
    if (duplicateReview) {
      set({ lastError: 'Bu gediş üçün artıq rəy yazmısınız.' });
      return false;
    }
    const review: Review = {
      id: generateId(),
      tripId: data.tripId,
      authorId: currentUser.id,
      targetUserId: data.targetUserId,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const allReviews = [...s.reviews, review];
      
      const targetReviews = allReviews.filter((r) => r.targetUserId === data.targetUserId);
      const avgRating = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
      return {
        reviews: allReviews,
        users: s.users.map((u) =>
          u.id === data.targetUserId ? { ...u, rating: Math.round(avgRating * 10) / 10 } : u,
        ),
        currentUser:
          s.currentUser?.id === data.targetUserId
            ? { ...s.currentUser, rating: Math.round(avgRating * 10) / 10 }
            : s.currentUser,
        lastError: null,
      };
    });
    return true;
  },
});
