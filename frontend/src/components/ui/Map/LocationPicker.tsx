import { useEffect } from 'react';
import { MarkerF, useGoogleMap } from '@react-google-maps/api';
import { PRESET_LOCATIONS } from '@/lib/utils';

interface LocationPickerProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  onSelectOrigin: (pos: { lat: number; lng: number }) => void;
  onSelectDestination: (pos: { lat: number; lng: number }) => void;
  mode: 'origin' | 'destination';
  departureCity?: string;
  arrivalCity?: string;
}

const PRESET_ICON = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';

const LocationPicker = ({
  origin,
  destination,
  onSelectOrigin,
  onSelectDestination,
  mode,
  departureCity,
  arrivalCity,
}: LocationPickerProps) => {
  const map = useGoogleMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (mode === 'origin') {
        onSelectOrigin(pos);
      } else {
        onSelectDestination(pos);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, mode, onSelectOrigin, onSelectDestination]);

  const activeCity = mode === 'origin' ? departureCity : arrivalCity;
  const presets = activeCity ? (PRESET_LOCATIONS[activeCity] ?? []) : [];

  return (
    <>
      {presets.map((preset) => (
        <MarkerF
          key={preset.name}
          position={{ lat: preset.lat, lng: preset.lng }}
          icon={PRESET_ICON}
          title={preset.name}
          onClick={() => {
            const pos = { lat: preset.lat, lng: preset.lng };
            if (mode === 'origin') {
              onSelectOrigin(pos);
            } else {
              onSelectDestination(pos);
            }
          }}
        />
      ))}

      {origin && (
        <MarkerF
          position={origin}
          draggable={true}
          icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          onDragEnd={(e) => {
            if (e.latLng) onSelectOrigin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }}
        />
      )}

      {destination && (
        <MarkerF
          position={destination}
          draggable={true}
          icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          onDragEnd={(e) => {
            if (e.latLng) onSelectDestination({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }}
        />
      )}
    </>
  );
};

export default LocationPicker;
