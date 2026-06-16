'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ReviewCard from '@/components/reviews/ReviewCard';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/services/api-client';
import { apiReviewsService } from '@/services/api/api-reviews-service';
import { mapApiUserToUser, type ApiUser } from '@/services/api/mappers';
import type { Review, User } from '@/types';

const PROFILE_DETAILS_I18N = {
  az: {
    title: 'Profil',
    notFound: 'Profil tapılmadı',
    reviewsTitle: 'Rəylər',
    noBio: 'İstifadəçi bio əlavə etməyib.',
  },
  ru: {
    title: 'Профиль',
    notFound: 'Профиль не найден',
    reviewsTitle: 'Отзывы',
    noBio: 'Пользователь не добавил описание.',
  },
  en: {
    title: 'Profile',
    notFound: 'Profile not found',
    reviewsTitle: 'Reviews',
    noBio: 'This user has not added a bio.',
  },
} as const;

export default function PublicProfilePage() {
  const { id } = useParams();
  const language = useAppStore((state) => state.language);
  const users = useAppStore((state) => state.users);
  const copy = PROFILE_DETAILS_I18N[language] || PROFILE_DETAILS_I18N.en;
  const userId = Array.isArray(id) ? id[0] : id;
  const [user, setUser] = React.useState<User | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(Boolean(userId));
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        const [userResponse, reviewResponse] = await Promise.all([
          apiClient.get<ApiUser>(`/users/${userId}`),
          apiReviewsService.getReviewsForUser(userId),
        ]);

        if (!active) {
          return;
        }

        setUser(mapApiUserToUser(userResponse));
        setReviews(reviewResponse);
      } catch {
        if (!active) {
          return;
        }
        setUser(null);
        setReviews([]);
        setNotFound(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <WebLayout title={copy.title} narrow showBack>
        <LoadingState />
      </WebLayout>
    );
  }

  if (!userId || notFound || !user) {
    return (
      <WebLayout title={copy.title} narrow showBack>
        <EmptyState title={copy.notFound} />
      </WebLayout>
    );
  }

  return (
    <WebLayout title={copy.title} narrow showBack>
      <div className="stagger-children">
        <ProfileHeader user={user} reviewsCount={reviews.length} />

        <Card className="mt-4">
          <p className="text-sm text-text-secondary">{user.bio || copy.noBio}</p>
        </Card>

        {reviews.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-text">{copy.reviewsTitle}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  author={users.find((candidate) => candidate.id === review.authorId)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </WebLayout>
  );
}
