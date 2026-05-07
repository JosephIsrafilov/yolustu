'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface RouteTimelineProps {
  departure: string;
  arrival: string;
  meetingPoint?: string;
  dropoffPoint?: string;
}

export default function RouteTimeline({
  departure,
  arrival,
  meetingPoint,
  dropoffPoint,
}: RouteTimelineProps) {
  return (
    <div className="flex gap-3">
      {/* Timeline dots/line */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
        <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-300 to-brand-600 my-1 min-h-[40px]" />
        <div className="w-3 h-3 rounded-full bg-brand-700 ring-4 ring-brand-100" />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-between flex-1 py-0.5">
        <div>
          <p className="text-base font-semibold text-text">{departure}</p>
          {meetingPoint && (
            <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
              <MapPin size={11} className="shrink-0" />
              {meetingPoint}
            </p>
          )}
        </div>
        <div>
          <p className="text-base font-semibold text-text">{arrival}</p>
          {dropoffPoint && (
            <p className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
              <MapPin size={11} className="shrink-0" />
              {dropoffPoint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
