'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useJsApiLoader } from '@react-google-maps/api';
import { env } from '@/lib/env';
import { SmartMapProps } from './types';
import { useOsrmRoute } from './utils';

const GoogleMapRenderer = dynamic(() => import('./GoogleMapRenderer'), {
  ssr: false,
  loading: () => <div className="w-full animate-pulse bg-slate-100 rounded-xl h-[400px]" />,
});

const SimpleMapRenderer = dynamic(() => import('./SimpleMapRenderer'), {
  ssr: false,
  loading: () => <div className="w-full animate-pulse bg-slate-100 rounded-xl h-[400px]" />,
});

export default function SmartMap(props: SmartMapProps) {
  const googleKey = env.googleMapsApiKey;
  const useGoogle = env.mapProvider.toLowerCase() === 'google' && Boolean(googleKey);
  const fetchedRoute = useOsrmRoute(props.origin, props.destination);
  const routeToUse = props.route || fetchedRoute;

  const finalProps = { ...props, route: routeToUse };

  if (!useGoogle) {
    return <SimpleMapRenderer {...finalProps} />;
  }

  return <GoogleSmartMap googleKey={googleKey} mapProps={finalProps} />;
}

function GoogleSmartMap({ googleKey, mapProps }: { googleKey: string; mapProps: SmartMapProps }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleKey,
  });

  if (loadError) {
    return <SimpleMapRenderer {...mapProps} />;
  }

  if (!isLoaded) {
    return <div className={`w-full animate-pulse bg-slate-100 rounded-xl ${mapProps.className || 'h-[400px]'}`} />;
  }

  return (
    <Suspense fallback={<div className={`w-full animate-pulse bg-slate-100 rounded-xl ${mapProps.className || 'h-[400px]'}`} />}>
      <GoogleMapRenderer {...mapProps} />
    </Suspense>
  );
}
