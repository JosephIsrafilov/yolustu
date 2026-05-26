'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import ReviewForm from '@/components/reviews/ReviewForm';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { I18N } from '@/lib/i18n';

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createReview, trips, users, lastError, clearError, language } = useAppStore();

  const tripId = searchParams.get('tripId') || '';
  const targetUserId = searchParams.get('targetUserId') || '';
  const trip = trips.find((t) => t.id === tripId);
  const target = users.find((u) => u.id === targetUserId);

  const common = I18N[language].common;

  const handleSubmit = async (data: { rating: number; comment: string }) => {
    const ok = await createReview({ tripId, targetUserId, ...data });
    if (ok) router.push(ROUTES.bookings);
  };

  const getEvaluationText = () => {
    if (!trip || !target) return '';
    const route = `${trip.departureCity} → ${trip.arrivalCity}`;
    if (language === 'ru') {
      return (
        <>
          Оцените <span className="font-semibold">{target.fullName}</span> за поездку <span className="font-semibold">{route}</span>
        </>
      );
    }
    if (language === 'en') {
      return (
        <>
          Rate <span className="font-semibold">{target.fullName}</span> for the ride <span className="font-semibold">{route}</span>
        </>
      );
    }
    return (
      <>
        <span className="font-semibold">{route}</span> gedişi üçün <span className="font-semibold">{target.fullName}</span>-ı qiymətləndirin
      </>
    );
  };

  return (
    <div>
      {trip && target && (
        <Card padding="md" className="mb-6 bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-700">
            {getEvaluationText()}
          </p>
        </Card>
      )}
      {lastError && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
          <div className="flex items-center justify-between gap-3">
            <span>{lastError}</span>
            <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
          </div>
        </div>
      )}
      <ReviewForm onSubmit={handleSubmit} />
    </div>
  );
}

export default function CreateReviewPage() {
  const { language } = useAppStore();
  const copy = I18N[language].reviews;
  
  const loadingText = {
    az: 'Yüklənir...',
    ru: 'Загрузка...',
    en: 'Loading...',
  }[language] || 'Loading...';

  return (
    <WebLayout title={copy.title} showBack narrow>
      <ProtectedRoute>
        <Suspense fallback={<div className="p-4 text-center text-text-muted">{loadingText}</div>}>
          <ReviewContent />
        </Suspense>
      </ProtectedRoute>
    </WebLayout>
  );
}
