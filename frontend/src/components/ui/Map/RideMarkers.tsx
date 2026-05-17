import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { Trip, User } from '@/types';

const rideIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface RideMarkersProps {
  trips: Trip[];
  users: User[];
}

const RideMarkers = ({ trips, users }: RideMarkersProps) => {
  return (
    <>
      {trips.map((trip) => {
        if (!trip.origin) return null;
        
        const driver = users.find(u => u.id === trip.driverId);
        
        return (
          <Marker 
            key={trip.id} 
            position={[trip.origin.lat, trip.origin.lng]} 
            icon={rideIcon}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <div className="font-bold text-[#002f37] mb-1">
                  {driver?.fullName || 'Sürücü'}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {trip.departureCity} → {trip.arrivalCity}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#054752]">{trip.pricePerSeat} ₼</span>
                  <Link 
                    href={`/trips/${trip.id}`}
                    className="bg-[#054752] text-white text-[10px] px-2 py-1 rounded font-bold hover:bg-[#043a43] transition-colors"
                  >
                    Bax
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default RideMarkers;
