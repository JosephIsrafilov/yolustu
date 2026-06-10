'use client';

import Icon from '@/components/ui/Icon';
import UserAvatar from '@/components/ui/UserAvatar';
import { getLocalizedCityName } from '@/lib/cities';
import { formatRating } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  reviewsCount?: number;
}

const PROFILE_STATS_LABELS = {
  az: {
    trips: 'Gediş',
    rating: 'Reytinq',
    reviews: 'Rəy',
  },
  ru: {
    trips: 'Поездки',
    rating: 'Рейтинг',
    reviews: 'Отзывы',
  },
  en: {
    trips: 'Trips',
    rating: 'Rating',
    reviews: 'Reviews',
  },
} as const;

export default function ProfileHeader({ user, reviewsCount = 0 }: ProfileHeaderProps) {
  const language = useAppStore((state) => state.language);
  const labels = PROFILE_STATS_LABELS[language];

  return (
    <div className="flex flex-col items-center px-4 py-6 text-center">
      <UserAvatar
        name={user.fullName}
        avatarUrl={user.avatarUrl}
        size={80}
        className="mb-3 shadow-lg"
      />

      <h2 className="text-xl font-bold text-text">{user.fullName}</h2>

      <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
        {user.city && (
          <span className="flex items-center gap-1">
            <Icon name="map-pin" size={14} />
            {getLocalizedCityName(user.city, language)}
          </span>
        )}
        {user.rating > 0 && (
          <span className="flex items-center gap-1">
            <Icon name="star" size={14} className="text-accent-500" fill="currentColor" />
            {formatRating(user.rating)}
          </span>
        )}
      </div>

      <div className="mt-4 flex w-full max-w-xs items-center gap-6 border-t border-border pt-4">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{user.totalTrips}</p>
          <p className="text-xs text-text-muted">{labels.trips}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{user.rating > 0 ? user.rating.toFixed(1) : '—'}</p>
          <p className="text-xs text-text-muted">{labels.rating}</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{reviewsCount}</p>
          <p className="text-xs text-text-muted">{labels.reviews}</p>
        </div>
      </div>
    </div>
  );
}
