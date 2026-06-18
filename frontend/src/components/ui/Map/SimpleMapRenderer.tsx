import React from 'react';
import { SmartMapProps } from './types';
import { cn } from '@/lib/utils';

function projectPoint(point: [number, number], bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const x = ((point[1] - bounds.minLng) / lngRange) * 100;
  const y = (1 - (point[0] - bounds.minLat) / latRange) * 100;
  return [Math.min(96, Math.max(4, x)), Math.min(92, Math.max(8, y))] as const;
}

export default function SimpleMapRenderer({
  center = [40.4093, 49.8671],
  className,
  markers = [],
  route,
  polylines = [],
  fitBounds,
}: SmartMapProps) {
  const points = [
    center,
    ...(route ?? []),
    ...polylines.flat(),
    ...(fitBounds ?? []),
    ...markers.map((marker) => marker.position),
  ];

  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  const bounds = {
    minLat: Math.min(...lats) - 0.08,
    maxLat: Math.max(...lats) + 0.08,
    minLng: Math.min(...lngs) - 0.08,
    maxLng: Math.max(...lngs) + 0.08,
  };

  const routePoints = (route ?? []).map((point) => projectPoint(point, bounds));
  const polylinePoints = polylines.map((path) => path.map((point) => projectPoint(point, bounds)));
  const hasHeight = className && (className.includes('h-') || className.includes('min-h-'));

  return (
    <div className={cn(!hasHeight && 'h-[400px]', 'relative w-full overflow-hidden rounded-2xl border border-border bg-[#e8f4f6]', className)}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="map-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(5,71,82,0.08)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#map-grid)" />
        <path d="M78 0 C72 22 83 38 76 57 C70 73 79 86 74 100 L100 100 L100 0 Z" fill="rgba(20,184,166,0.13)" />
        {polylinePoints.map((path, index) => (
          <polyline
            key={`poly-${index}`}
            points={path.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#0f766e"
            strokeOpacity="0.5"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {routePoints.length > 1 && (
          <polyline
            points={routePoints.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#054752"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {markers.map((marker, index) => {
        const [x, y] = projectPoint(marker.position, bounds);
        const color = marker.type === 'origin' ? 'bg-emerald-600' : marker.type === 'destination' ? 'bg-red-600' : 'bg-[#054752]';
        return (
          <button
            key={index}
            type="button"
            onClick={marker.onClick}
            className={cn('absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md', color)}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={marker.popup ? 'Map marker' : undefined}
          />
        );
      })}
    </div>
  );
}
