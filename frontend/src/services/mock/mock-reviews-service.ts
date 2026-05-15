import { ApiError } from '@/services/api-error';
import type { ReviewsService } from '@/services/contracts/reviews-service';
import { useAppStore } from '@/store/useAppStore';
import { requireCurrentUser } from '@/services/mock/mock-service-utils';
import type { Review } from '@/types';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}`;
}

export const mockReviewsService: ReviewsService = {
  async createReview(input) {
    const currentUser = requireCurrentUser();
    const state = useAppStore.getState();
    const trip = state.trips.find((item) => item.id === input.tripId);
    if (!trip) {
      throw new ApiError({
        code: 'NOT_FOUND',
        message: 'Trip not found.',
      });
    }

    const isDriver = trip.driverId === currentUser.id;
    const isAcceptedPassenger = state.bookings.some(
      (booking) =>
        booking.tripId === trip.id &&
        booking.passengerId === currentUser.id &&
        booking.status === 'accepted',
    );
    if (!isDriver && !isAcceptedPassenger) {
      throw new ApiError({
        code: 'FORBIDDEN',
        message: 'Only trip participants can leave reviews.',
      });
    }
    if (currentUser.id === input.targetUserId) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'You cannot review yourself.',
      });
    }

    const review: Review = {
      id: createId(),
      tripId: input.tripId,
      authorId: currentUser.id,
      targetUserId: input.targetUserId,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    };

    const targetReviews = [...state.reviews, review].filter(
      (item) => item.targetUserId === input.targetUserId,
    );
    const rating =
      targetReviews.reduce((sum, item) => sum + item.rating, 0) / targetReviews.length;
    useAppStore.setState((current) => ({
      users: current.users.map((user) =>
        user.id === input.targetUserId ? { ...user, rating } : user,
      ),
    }));

    return review;
  },

  async getReviewsForUser(userId) {
    return useAppStore.getState().reviews.filter((review) => review.targetUserId === userId);
  },
};
