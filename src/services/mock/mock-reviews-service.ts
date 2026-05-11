import { ApiError } from '@/services/api-error';
import type { ReviewsService } from '@/services/contracts/reviews-service';
import { useAppStore } from '@/store/useAppStore';
import { buildStoreError, requireCurrentUser } from '@/services/mock/mock-service-utils';

export const mockReviewsService: ReviewsService = {
  async createReview(input) {
    const currentUser = requireCurrentUser();
    const reviewsBefore = useAppStore.getState().reviews.length;
    const ok = useAppStore.getState().createReview(input);
    if (!ok) {
      throw buildStoreError('Review could not be created.');
    }

    const reviewsAfter = useAppStore.getState().reviews;
    const createdReview = reviewsAfter
      .slice(reviewsBefore)
      .find(
        (review) =>
          review.authorId === currentUser.id &&
          review.tripId === input.tripId &&
          review.targetUserId === input.targetUserId &&
          review.rating === input.rating &&
          review.comment === input.comment,
      );

    if (!createdReview) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Review was created but is missing.',
      });
    }
    return createdReview;
  },

  async getReviewsForUser(userId) {
    return useAppStore.getState().reviews.filter((review) => review.targetUserId === userId);
  },
};
