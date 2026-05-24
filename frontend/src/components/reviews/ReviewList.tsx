'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiReviewsService } from '@/services/api/api-reviews-service';
import ReviewCard from './ReviewCard';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';

interface ReviewListProps {
  userId: string;
}

export default function ReviewList({ userId }: ReviewListProps) {
  const { language } = useAppStore();
  const copy = I18N[language].reviews;

  const { data: reviews, isLoading, isError } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: () => apiReviewsService.getReviewsForUser(userId),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <EmptyState
        title={copy?.emptyTitle || 'Error loading reviews'}
        description="Could not load reviews at this time."
      />
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        title={copy?.emptyTitle || 'No reviews yet'}
        description={copy?.emptyDescription || 'This user has not received any reviews.'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-text mb-2">
        {copy?.reviewsTitle || 'Reviews'} ({reviews.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
