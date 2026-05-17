import React from 'react';
import { Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface TripRouteProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  departureCity: string;
  arrivalCity: string;
}

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

interface OsrmRouteResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

export default function TripRoute({ origin, destination, departureCity, arrivalCity }: TripRouteProps) {
  const map = useMap();
  const markerPositions: [number, number][] = React.useMemo(() => [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ], [origin.lat, origin.lng, destination.lat, destination.lng]);
  const [routePositions, setRoutePositions] = React.useState<[number, number][]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
    });
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`OSRM route failed with ${response.status}`);
        return response.json() as Promise<OsrmRouteResponse>;
      })
      .then((data) => {
        const coordinates = data.routes?.[0]?.geometry?.coordinates ?? [];
        setRoutePositions(coordinates.map(([lng, lat]) => [lat, lng]));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Route geometry error:', error);
        setRoutePositions([]);
      });

    return () => controller.abort();
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  React.useEffect(() => {
    const boundsPositions = routePositions.length > 0 ? routePositions : markerPositions;
    map.fitBounds(L.latLngBounds(boundsPositions), { padding: [36, 36], maxZoom: 11 });
  }, [map, markerPositions, routePositions]);

  return (
    <>
      {routePositions.length > 0 && (
        <Polyline positions={routePositions} pathOptions={{ color: '#054752', weight: 4, opacity: 0.75 }} />
      )}
      <Marker position={markerPositions[0]} icon={originIcon}>
        <Popup>{departureCity}</Popup>
      </Marker>
      <Marker position={markerPositions[1]} icon={destinationIcon}>
        <Popup>{arrivalCity}</Popup>
      </Marker>
    </>
  );
}
