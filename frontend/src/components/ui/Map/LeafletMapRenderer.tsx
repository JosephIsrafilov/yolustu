import { MapContainer as LeafletMap, TileLayer, useMap, AttributionControl, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SmartMapProps } from './types';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const originIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const destinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    
    const timer1 = window.setTimeout(() => map.invalidateSize(), 100);
    const timer2 = window.setTimeout(() => map.invalidateSize(), 500);
    
    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, [map]);

  return null;
}

function MapController({ center, zoom, fitBounds }: { center?: [number, number]; zoom?: number; fitBounds?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (fitBounds && fitBounds.length > 0) {
      map.fitBounds(L.latLngBounds(fitBounds), { padding: [36, 36], maxZoom: 11 });
    } else if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, fitBounds, map]);

  return null;
}

export default function LeafletMapRenderer({
  center = [40.4093, 49.8671],
  zoom = 12,
  className,
  markers = [],
  route,
  polylines = [],
  fitBounds,
  children,
}: SmartMapProps) {
  const hasHeight = className && (className.includes('h-') || className.includes('min-h-'));

  const getIcon = (type?: string) => {
    if (type === 'origin') return originIcon;
    if (type === 'destination') return destinationIcon;
    return DefaultIcon;
  };

  return (
    <div className={cn(!hasHeight && 'h-[400px]', 'w-full relative flex flex-col rounded-2xl overflow-hidden shadow-sm border border-border z-0', className)}>
      <LeafletMap 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        attributionControl={false}
        style={{ height: '100%', width: '100%', minHeight: '100%', flexGrow: 1 }}
      >
        <ResizeMap />
        <MapController center={center} zoom={zoom} fitBounds={fitBounds} />
        <AttributionControl prefix={false} position="bottomright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {route && route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{ color: '#054752', weight: 4, opacity: 0.75 }}
          />
        )}
        
        {polylines.map((path, idx) => (
          <Polyline
            key={`poly-${idx}`}
            positions={path}
            pathOptions={{ color: '#054752', weight: 3, opacity: 0.55 }}
          />
        ))}
        
        {markers.map((m, i) => (
          <Marker 
            key={i} 
            position={m.position} 
            icon={getIcon(m.type)}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
        {children}
      </LeafletMap>
    </div>
  );
}
