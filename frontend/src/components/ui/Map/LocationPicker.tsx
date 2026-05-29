import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const originIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  onSelectOrigin: (pos: { lat: number; lng: number }) => void;
  onSelectDestination: (pos: { lat: number; lng: number }) => void;
  mode: 'origin' | 'destination';
}

const LocationPicker = ({ origin, destination, onSelectOrigin, onSelectDestination, mode }: LocationPickerProps) => {
  useMapEvents({
    click(e) {
      if (mode === 'origin') {
        onSelectOrigin(e.latlng);
      } else {
        onSelectDestination(e.latlng);
      }
    },
  });

  return (
    <>
      {origin && (
        <Marker
          position={origin}
          icon={originIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              onSelectOrigin(marker.getLatLng());
            },
          }}
        />
      )}
      {destination && (
        <Marker
          position={destination}
          icon={destinationIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              onSelectDestination(marker.getLatLng());
            },
          }}
        />
      )}
    </>
  );
};

export default LocationPicker;
