'use client';

import { use, useEffect, useState } from 'react';
import { tripsService } from '@/services';
import { useTracking } from '@/hooks/useTracking';
import type { PublicTrackInfo } from '@/services/contracts/trips-service';
import TrackingMap from '@/components/ui/Map/TrackingMap';

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  live: 'Live',
  completed: 'Trip completed',
  ended: 'Trip ended',
};

export default function PublicTrackPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = use(params);
  const [info, setInfo] = useState<PublicTrackInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    tripsService
      .getPublicTrack(shareToken)
      .then((data) => {
        if (active) setInfo(data);
      })
      .catch(() => {
        if (active) setError('This tracking link is invalid or has expired.');
      });
    return () => {
      active = false;
    };
  }, [shareToken]);

  const tracking = useTracking(info?.rideId ?? null, { shareToken });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Tracking unavailable</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#054752]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Live trip</p>
          <h1 className="text-lg font-semibold text-slate-900">
            {info.originCity} → {info.destinationCity}
          </h1>
          <p className="text-sm text-slate-500">
            {info.driverName ? `Driver: ${info.driverName}` : 'Driver'}
            {info.carModel ? ` · ${info.carModel}` : ''}
          </p>
        </div>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
            tracking.status === 'live'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {tracking.status === 'live' && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          )}
          {STATUS_LABEL[tracking.status] ?? tracking.status}
        </span>
      </header>

      <main className="relative flex-1">
        <TrackingMap
          route={
            tracking.route.length > 0
              ? tracking.route
              : [info.origin, info.destination]
          }
          position={tracking.position}
          heading={tracking.heading}
          className="h-[calc(100vh-180px)] w-full"
        />
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#054752] transition-all duration-700 ease-out"
            style={{ width: `${Math.round(tracking.progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-slate-500">
          {Math.round(tracking.progress * 100)}% of route covered
        </p>
      </footer>
    </div>
  );
}
