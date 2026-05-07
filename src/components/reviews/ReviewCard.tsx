'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Star } from 'lucide-react';
import type { Review, User } from '@/types';

interface ReviewCardProps {
  review: Review;
  author?: User;
}

export default function ReviewCard({ review, author }: ReviewCardProps) {
  return (
    <Card padding="sm" className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
          {author?.fullName?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">
              {author?.fullName || 'İstifadəçi'}
            </p>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={
                    i < review.rating
                      ? 'text-accent-500 fill-accent-500'
                      : 'text-gray-200'
                  }
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-sm text-text-secondary mt-1">{review.comment}</p>
          )}
          <p className="text-[10px] text-text-muted mt-1">
            {new Date(review.createdAt).toLocaleDateString('az-AZ')}
          </p>
        </div>
      </div>
    </Card>
  );
}
