import React from 'react';

export interface MapMarkerData {
  position: [number, number]; // [lat, lng]
  popup?: React.ReactNode;
  type?: 'origin' | 'destination' | 'ride';
}

export interface SmartMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  route?: [number, number][]; // Array of [lat, lng]
  polylines?: [number, number][][]; // Multiple polylines
  markers?: MapMarkerData[];
  fitBounds?: [number, number][]; // Array of [lat, lng] to fit
  children?: React.ReactNode;
}
