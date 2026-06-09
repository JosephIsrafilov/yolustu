import dynamic from 'next/dynamic';
import React from 'react';

export const MapContainer = dynamic(
  () => import('./SmartMap'),
  { 
    ssr: false,
    loading: () => React.createElement('div', { className: "h-[400px] w-full animate-pulse bg-gray-100 rounded-xl" })
  }
);

export const LocationPicker = dynamic(
  () => import('./LocationPicker'),
  { ssr: false }
);
