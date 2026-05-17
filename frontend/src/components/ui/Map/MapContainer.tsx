import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React from 'react';

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
}

const MapContainer = ({ center = [40.4093, 49.8671], zoom = 12, children }: MapProps) => {
  return (
    <div className="h-[400px] w-full">
      <LeafletMap center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
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
