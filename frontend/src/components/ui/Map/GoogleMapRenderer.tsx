import React, { useEffect, useMemo } from 'react';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import { SmartMapProps } from './types';
import { cn } from '@/lib/utils';

export default function GoogleMapRenderer({
  center = [40.4093, 49.8671],
  zoom = 12,
  className,
  markers = [],
  route,
  polylines = [],
  fitBounds,
  children,
}: SmartMapProps) {
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const hasHeight = className && (className.includes('h-') || className.includes('min-h-'));

  const parsedCenter = useMemo(() => ({ lat: center[0], lng: center[1] }), [center]);

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (fitBounds && fitBounds.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        fitBounds.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        map.fitBounds(bounds, 36);
      }
    },
    [fitBounds]
  );

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  // Update bounds if they change after mount
  useEffect(() => {
    if (mapRef.current && fitBounds && fitBounds.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      fitBounds.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      mapRef.current.fitBounds(bounds, 36);
    }
  }, [fitBounds]);

  const routePath = useMemo(() => {
    return route?.map(([lat, lng]) => ({ lat, lng })) || [];
  }, [route]);

  return (
    <div className={cn(!hasHeight && 'h-[400px]', 'w-full relative flex flex-col rounded-2xl overflow-hidden shadow-sm border border-border z-0', className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={parsedCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: false,
        }}
      >
        {routePath.length > 0 && (
          <PolylineF
            path={routePath}
            options={{ strokeColor: '#054752', strokeWeight: 4, strokeOpacity: 0.75 }}
          />
        )}
        {polylines.map((path, idx) => (
          <PolylineF
            key={`poly-${idx}`}
            path={path.map(([lat, lng]) => ({ lat, lng }))}
            options={{ strokeColor: '#054752', strokeWeight: 3, strokeOpacity: 0.55 }}
          />
        ))}
        {markers.map((m, i) => (
          <MarkerF
            key={i}
            position={{ lat: m.position[0], lng: m.position[1] }}
            // We could add custom icons based on m.type here
            // icon={{ url: m.type === 'origin' ? '...' : '...' }}
          />
        ))}
        {children}
      </GoogleMap>
    </div>
  );
}
