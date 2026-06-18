'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';
import type { LatLng } from '@/hooks/useTracking';

interface TrackingMapProps {
  route: LatLng[];
  position: LatLng | null;
  heading: number;
  className?: string;
}

const CONTAINER_STYLE = { width: '100%', height: '100%' };
const DEFAULT_CENTER = { lat: 40.4093, lng: 49.8671 };

/**
 * Eases the car marker from its current rendered point toward the latest WS
 * target on every animation frame, so movement is smooth instead of a hard
 * jump each tick. Standard exponential smoothing — no animation library.
 */
function InnerTrackingMap({ route, position, heading, className }: TrackingMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [rendered, setRendered] = useState<LatLng | null>(position);

  // Latest target the marker should ease toward.
  const targetRef = useRef<LatLng | null>(position);
  const renderedRef = useRef<LatLng | null>(position);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (position) targetRef.current = position;
  }, [position]);

  // Seed the rendered position the first time we get one.
  useEffect(() => {
    if (position && !renderedRef.current) {
      renderedRef.current = position;
      setRendered(position);
    }
  }, [position]);

  useEffect(() => {
    const SMOOTHING = 0.12; // 0..1 — higher snaps faster, lower glides longer
    const EPSILON = 1e-6;

    const tick = () => {
      const target = targetRef.current;
      const current = renderedRef.current;
      if (target && current) {
        const nextLat = current.lat + (target.lat - current.lat) * SMOOTHING;
        const nextLng = current.lng + (target.lng - current.lng) * SMOOTHING;
        const next = { lat: nextLat, lng: nextLng };
        renderedRef.current = next;
        if (
          Math.abs(target.lat - nextLat) > EPSILON ||
          Math.abs(target.lng - nextLng) > EPSILON
        ) {
          setRendered(next);
        } else if (current.lat !== target.lat || current.lng !== target.lng) {
          renderedRef.current = target;
          setRendered(target);
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const routePath = useMemo(() => route.map((p) => ({ lat: p.lat, lng: p.lng })), [route]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    if (routePath.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      routePath.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 48);
    }
  };

  // Keep the car comfortably in view as it moves.
  useEffect(() => {
    if (mapRef.current && rendered) {
      mapRef.current.panTo(rendered);
    }
  }, [rendered]);

  // A rotatable arrow so heading is visible. SYMBOL is part of the maps lib.
  const carIcon = useMemo<google.maps.Symbol | undefined>(() => {
    if (typeof window === 'undefined' || !window.google) return undefined;
    return {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#054752',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      rotation: heading,
    };
  }, [heading]);

  const center = rendered ?? routePath[0] ?? DEFAULT_CENTER;

  return (
    <div className={className ?? 'h-[60vh] w-full'}>
      <GoogleMap
        mapContainerStyle={CONTAINER_STYLE}
        center={center}
        zoom={14}
        onLoad={onLoad}
        options={{ disableDefaultUI: true, zoomControl: true, scrollwheel: true }}
      >
        {routePath.length > 1 && (
          <PolylineF
            path={routePath}
            options={{ strokeColor: '#054752', strokeWeight: 4, strokeOpacity: 0.7 }}
          />
        )}
        {routePath[0] && (
          <MarkerF position={routePath[0]} icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png" />
        )}
        {routePath.length > 1 && (
          <MarkerF
            position={routePath[routePath.length - 1]}
            icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          />
        )}
        {rendered && <MarkerF position={rendered} icon={carIcon} zIndex={1000} />}
      </GoogleMap>
    </div>
  );
}

function TrackingMapLoader(props: TrackingMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-500 ${props.className ?? 'h-[60vh] w-full'}`}>
        Failed to load map
      </div>
    );
  }
  if (!isLoaded) {
    return <div className={`animate-pulse bg-slate-100 ${props.className ?? 'h-[60vh] w-full'}`} />;
  }
  return (
    <Suspense fallback={<div className={`animate-pulse bg-slate-100 ${props.className ?? 'h-[60vh] w-full'}`} />}>
      <InnerTrackingMap {...props} />
    </Suspense>
  );
}

// ssr:false — the maps SDK touches window.
export default dynamic(() => Promise.resolve(TrackingMapLoader), { ssr: false });
