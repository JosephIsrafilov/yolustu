'use client';

import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import type { Review, User } from '@/types';

interface ReviewCardProps {
  review: Review;
  author?: User;
}

export default function ReviewCard({ review, author }: ReviewCardProps) {
  return (
    <Card padding="sm" className="animate-fade-in min-h-[110px]">
      <div className="grid grid-cols-[32px_1fr] gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0 flex-none">
          {author?.fullName?.charAt(0) || '?'}
        </div>
        <div className="min-w-0">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center h-5">
            <p className="text-sm font-semibold text-text truncate block w-full">
              {author?.fullName || 'İstifadəçi'}
            </p>
            <div className="flex items-center gap-0.5 shrink-0 flex-none h-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon
                  key={i}
                  name="star"
                  size={12}
                  fill={i < review.rating ? 'currentColor' : 'none'}
                  className={
                    i < review.rating
                      ? 'text-accent-500 shrink-0 flex-none'
                      : 'text-gray-200 shrink-0 flex-none'
                  }
                />
              ))}
            </div>
          </div>
          {review.comment ? (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2 h-[2.5rem] w-full block leading-5">{review.comment}</p>
          ) : (
            <div className="h-[2.5rem] w-full" />
          )}
          <p className="text-[10px] text-text-muted mt-1 leading-4 h-4 truncate block w-full">
            {new Date(review.createdAt).toLocaleDateString('az-AZ')}
          </p>
        </div>
      </div>
    </Card>
  );
}
