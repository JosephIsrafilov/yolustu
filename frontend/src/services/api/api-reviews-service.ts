import { apiClient } from '@/services/api-client';
import type {
  CreateReviewInput,
  ReviewsService,
} from '@/services/contracts/reviews-service';
import { mapApiReviewToReview, type ApiReview } from './mappers';

export const apiReviewsService: ReviewsService = {
  async createReview(input: CreateReviewInput) {
    const response = await apiClient.post<ApiReview>('/reviews', {
      ride_id: input.tripId,
      target_id: input.targetUserId,
      rating: input.rating,
      comment: input.comment,
    });
    return mapApiReviewToReview(response);
  },

  async getReviewsForUser(userId) {
    const response = await apiClient.get<ApiReview[]>(`/reviews/user/${userId}`);
    return response.map(mapApiReviewToReview);
  },
};
