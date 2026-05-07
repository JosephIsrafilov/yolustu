'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import ReviewForm from '@/components/reviews/ReviewForm';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createReview, trips, users } = useAppStore();

  const tripId = searchParams.get('tripId') || '';
  const targetUserId = searchParams.get('targetUserId') || '';
  const trip = trips.find((t) => t.id === tripId);
  const target = users.find((u) => u.id === targetUserId);

  const handleSubmit = (data: { rating: number; comment: string }) => {
    createReview({ tripId, targetUserId, ...data });
    router.push(ROUTES.bookings);
  };

  return (
    <div className="px-4 pt-4 pb-6">
      {trip && target && (
        <Card padding="sm" className="mb-4 bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-700">
            <span className="font-semibold">{trip.departureCity} → {trip.arrivalCity}</span>
            {' '}gedişi üçün <span className="font-semibold">{target.fullName}</span>-ı qiymətləndirin
          </p>
        </Card>
      )}
      <ReviewForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function CreateReviewPage() {
  return (
    <MobileShell title="Rəy yazın" showBack showNav={false}>
      <Suspense fallback={<div className="p-4 text-center text-text-muted">Yüklənir...</div>}>
        <ReviewContent />
      </Suspense>
    </MobileShell>
  );
}
