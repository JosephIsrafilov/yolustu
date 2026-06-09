'use client';

import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { SmartMapProps } from './types';
import LeafletMapRenderer from './LeafletMapRenderer';
import GoogleMapRenderer from './GoogleMapRenderer';
import { useOsrmRoute } from './utils';

export default function SmartMap(props: SmartMapProps) {
  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'auto';
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const fetchedRoute = useOsrmRoute(props.origin, props.destination);
  const routeToUse = props.route || fetchedRoute;

  const finalProps = { ...props, route: routeToUse };

  const shouldUseGoogle = provider === 'google' || (provider === 'auto' && !!googleKey);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleKey || '',
  });

  // If forced leaflet, or if auto and no key, or if google fails to load
  if (!shouldUseGoogle || (!googleKey && provider === 'auto') || loadError) {
    if (loadError && provider === 'google') {
      console.warn('Google Maps failed to load, falling back to Leaflet');
    }
    return <LeafletMapRenderer {...finalProps} />;
  }

  if (!isLoaded) {
    return <div className={`w-full animate-pulse bg-slate-100 rounded-xl ${props.className || 'h-[400px]'}`} />;
  }

  return <GoogleMapRenderer {...finalProps} />;
}
