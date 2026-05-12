import { apiClient } from '@/services/api-client';
import type {
  CreateReviewInput,
  ReviewsService,
} from '@/services/contracts/reviews-service';
import type { Review } from '@/types';

export const apiReviewsService: ReviewsService = {
  async createReview(input: CreateReviewInput) {
    return apiClient.post<Review>('/reviews', input);
  },

  async getReviewsForUser(userId) {
    return apiClient.get<Review[]>(`/reviews/user/${userId}`);
  },
};
