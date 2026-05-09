'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import ReviewForm from '@/components/reviews/ReviewForm';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createReview, trips, users, lastError, clearError } = useAppStore();

  const tripId = searchParams.get('tripId') || '';
  const targetUserId = searchParams.get('targetUserId') || '';
  const trip = trips.find((t) => t.id === tripId);
  const target = users.find((u) => u.id === targetUserId);

  const handleSubmit = (data: { rating: number; comment: string }) => {
    const ok = createReview({ tripId, targetUserId, ...data });
    if (ok) router.push(ROUTES.bookings);
  };

  return (
    <div>
      {trip && target && (
        <Card padding="md" className="mb-6 bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-700">
            <span className="font-semibold">{trip.departureCity} → {trip.arrivalCity}</span>
            {' '}gedişi üçün <span className="font-semibold">{target.fullName}</span>-ı qiymətləndirin
          </p>
        </Card>
      )}
      {lastError && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
          <div className="flex items-center justify-between gap-3">
            <span>{lastError}</span>
            <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">Bağla</button>
          </div>
        </div>
      )}
      <ReviewForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function CreateReviewPage() {
  return (
    <WebLayout title="Rəy yazın" showBack narrow hideFooter>
      <ProtectedRoute>
      <Suspense fallback={<div className="p-4 text-center text-text-muted">Yüklənir...</div>}>
        <ReviewContent />
      </Suspense>
      </ProtectedRoute>
    </WebLayout>
  );
}
