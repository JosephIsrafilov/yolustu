'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
  loading?: boolean;
}

export default function ReviewForm({ onSubmit, loading = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { language } = useAppStore();

  const copy = I18N[language].reviews;

  const starSelectError = {
    az: 'Ulduz seçin',
    ru: 'Выберите оценку',
    en: 'Select stars',
  }[language] || 'Select stars';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-text mb-2 block">{copy.ratingLabel}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={copy.starRating.replace('{star}', star.toString())}
              className="p-1 transition-transform duration-100 hover:scale-110 active:scale-95"
            >
              <Icon
                name="star"
                size={32}
                fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                className={
                  star <= (hoverRating || rating)
                    ? 'text-accent-500 transition-colors duration-150'
                    : 'text-gray-200 transition-colors duration-150'
                }
              />
            </button>
          ))}
        </div>
        {rating === 0 && (
          <p className="text-xs text-text-muted mt-1">{starSelectError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text">{copy.commentLabel}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={copy.commentPlaceholder}
          className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <Button type="submit" fullWidth disabled={rating === 0} loading={loading}>
        {copy.submitBtn}
      </Button>
    </form>
  );
}
