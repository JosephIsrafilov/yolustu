'use client';

import React from 'react';
import { Star, MapPin, Car, Calendar } from 'lucide-react';
import { formatRating } from '@/lib/utils';
import type { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  reviewsCount?: number;
}

export default function ProfileHeader({ user, reviewsCount = 0 }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
        {user.fullName.charAt(0)}
      </div>

      <h2 className="text-xl font-bold text-text">{user.fullName}</h2>

      <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
        {user.city && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {user.city}
          </span>
        )}
        {user.rating > 0 && (
          <span className="flex items-center gap-1">
            <Star size={14} className="text-accent-500 fill-accent-500" />
            {formatRating(user.rating)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border w-full max-w-xs">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{user.totalTrips}</p>
          <p className="text-xs text-text-muted">Gediş</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{user.rating > 0 ? user.rating.toFixed(1) : '—'}</p>
          <p className="text-xs text-text-muted">Reytinq</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-brand-600">{reviewsCount}</p>
          <p className="text-xs text-text-muted">Rəy</p>
        </div>
      </div>
    </div>
  );
}
