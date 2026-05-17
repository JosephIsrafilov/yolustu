import dynamic from 'next/dynamic';
import React from 'react';

export const MapContainer = dynamic(
  () => import('./MapContainer'),
  { 
    ssr: false,
    loading: () => React.createElement('div', { className: "h-[400px] w-full animate-pulse bg-gray-100 rounded-xl" })
  }
);

export const LocationPicker = dynamic(
  () => import('./LocationPicker'),
  { ssr: false }
);

export const RideMarkers = dynamic(
  () => import('./RideMarkers'),
  { ssr: false }
);

export const TripRoute = dynamic(
  () => import('./TripRoute'),
  { ssr: false }
);
