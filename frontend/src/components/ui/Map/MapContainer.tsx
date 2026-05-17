import { MapContainer as LeafletMap, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

// Fix for default marker icons in Leaflet + Next.js
// Note: You may need to download these markers or use CDN links if public/images is empty
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
    const timer = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

const MapContainer = ({ center = [40.4093, 49.8671], zoom = 12, children, className }: MapProps) => {
  return (
    <div className={cn('h-full min-h-[400px] w-full', className)}>
      <LeafletMap center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
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
