import React from 'react';
import { Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import { Trip, User } from '@/types';
import { formatPrice } from '@/lib/utils';

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

interface RideMarkersProps {
  trips: Trip[];
  users: User[];
}

const RideMarkers = ({ trips, users }: RideMarkersProps) => {
  const map = useMap();
  const visibleTrips = React.useMemo(
    () => trips.filter((trip) => trip.origin && trip.destination),
    [trips],
  );
  const boundsPositions = React.useMemo(
    () =>
      visibleTrips.flatMap((trip) => [
        [trip.origin!.lat, trip.origin!.lng] as [number, number],
        [trip.destination!.lat, trip.destination!.lng] as [number, number],
      ]),
    [visibleTrips],
  );

  React.useEffect(() => {
    if (boundsPositions.length === 0) return;
    map.fitBounds(L.latLngBounds(boundsPositions), { padding: [44, 44], maxZoom: 9 });
  }, [boundsPositions, map]);

  return (
    <>
      {visibleTrips.map((trip) => {
        if (!trip.origin || !trip.destination) return null;

        const driver = trip.driver ?? users.find(u => u.id === trip.driverId);
        const originPosition: [number, number] = [trip.origin.lat, trip.origin.lng];
        const destinationPosition: [number, number] = [trip.destination.lat, trip.destination.lng];

        return (
          <React.Fragment key={trip.id}>
            <Polyline
              positions={[originPosition, destinationPosition]}
              pathOptions={{ color: '#054752', weight: 3, opacity: 0.55 }}
            />
            <Marker position={originPosition} icon={originIcon}>
              <Popup>
                <div className="min-w-[160px] p-1">
                  <div className="mb-1 font-bold text-[#002f37]">
                    {trip.departureCity} → {trip.arrivalCity}
                  </div>
                  <div className="mb-2 text-xs text-gray-600">
                    {driver?.fullName || 'Sürücü'} · {trip.time}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#054752]">{formatPrice(trip.pricePerSeat)}</span>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="rounded bg-[#054752] px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#043a43]"
                    >
                      Bax
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
            <Marker position={destinationPosition} icon={destinationIcon}>
              <Popup>
                <div className="min-w-[140px] p-1">
                  <div className="mb-1 font-bold text-[#002f37]">{trip.arrivalCity}</div>
                  <div className="text-xs text-gray-600">
                    {trip.departureCity} şəhərindən gediş
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default RideMarkers;
