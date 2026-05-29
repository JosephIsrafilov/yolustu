'use client';

import Icon from '@/components/ui/Icon';

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
  const normalizedDepartureCity = departure.trim();
  const normalizedArrivalCity = arrival.trim();
  const normalizedMeetingPoint = meetingPoint?.trim() || '';
  const normalizedDropoffPoint = dropoffPoint?.trim() || '';

  const departureMain = normalizedMeetingPoint || normalizedDepartureCity;
  const arrivalMain = normalizedDropoffPoint || normalizedArrivalCity;

  const showDepartureSub = normalizedDepartureCity.length > 0 && normalizedDepartureCity !== departureMain;
  const showArrivalSub = normalizedArrivalCity.length > 0 && normalizedArrivalCity !== arrivalMain;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <div className="w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
        <div className="w-0.5 flex-1 bg-gradient-to-b from-brand-300 to-brand-600 my-1 min-h-[40px]" />
        <div className="w-3 h-3 rounded-full bg-brand-700 ring-4 ring-brand-100" />
      </div>

      <div className="flex flex-col justify-between flex-1 py-0.5 min-w-0">
        <div className="min-w-0">
          <p className="ui-card-title text-text truncate">{departureMain}</p>
          {showDepartureSub && (
            <p className="ui-meta-text flex items-center gap-1 text-text-muted mt-0.5 min-w-0 break-words">
              <Icon name="map-pin" size={11} className="shrink-0 flex-none" />
              <span className="break-words">{normalizedDepartureCity}</span>
            </p>
          )}
        </div>
        <div className="min-w-0">
          <p className="ui-card-title text-text truncate">{arrivalMain}</p>
          {showArrivalSub && (
            <p className="ui-meta-text flex items-center gap-1 text-text-muted mt-0.5 min-w-0 break-words">
              <Icon name="map-pin" size={11} className="shrink-0 flex-none" />
              <span className="break-words">{normalizedArrivalCity}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
