import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    // Run immediately
    map.invalidateSize();
    
    // Run at 100ms and 500ms to ensure it catches parent layout transitions or animation delays
    const timer1 = window.setTimeout(() => map.invalidateSize(), 100);
    const timer2 = window.setTimeout(() => map.invalidateSize(), 500);
    
    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, [map]);

  return null;
}

const MapContainer = ({ center = [40.4093, 49.8671], zoom = 12, children, className }: MapProps) => {
  const hasHeight = className && (className.includes('h-') || className.includes('min-h-'));

  return (
    <div className={cn(!hasHeight && 'h-[400px]', 'w-full relative flex flex-col', className)}>
      <LeafletMap 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', minHeight: '100%', flexGrow: 1 }}
      >
        <ResizeMap />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {children}
      </LeafletMap>
    </div>
  );
};

export default MapContainer;
