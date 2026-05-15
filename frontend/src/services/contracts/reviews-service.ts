import type { Review } from '@/types';

export interface CreateReviewInput {
  tripId: string;
  targetUserId: string;
  rating: number;
  comment: string;
}

export interface ReviewsService {
  createReview(input: CreateReviewInput): Promise<Review>;
  getReviewsForUser(userId: string): Promise<Review[]>;
}
