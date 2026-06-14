'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import { SmartMapProps } from './types';
import { useOsrmRoute } from './utils';

const GoogleMapRenderer = dynamic(() => import('./GoogleMapRenderer'), {
  ssr: false,
  loading: () => <div className="w-full animate-pulse bg-slate-100 rounded-xl h-[400px]" />,
});

export default function SmartMap(props: SmartMapProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const fetchedRoute = useOsrmRoute(props.origin, props.destination);
  const routeToUse = props.route || fetchedRoute;

  const finalProps = { ...props, route: routeToUse };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleKey || '',
  });

  if (loadError) {
    return (
      <div className={`w-full flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 ${props.className || 'h-[400px]'}`}>
        Failed to load Google Maps
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`w-full animate-pulse bg-slate-100 rounded-xl ${props.className || 'h-[400px]'}`} />;
  }

  return (
    <Suspense fallback={<div className={`w-full animate-pulse bg-slate-100 rounded-xl ${props.className || 'h-[400px]'}`} />}>
      <GoogleMapRenderer {...finalProps} />
    </Suspense>
  );
}
