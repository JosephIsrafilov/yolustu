'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useGoogleMapsLoader } from './useGoogleMapsLoader';
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
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapProvider = env.mapProvider.toLowerCase();
  const useGoogle = Boolean(googleKey) && mapProvider !== 'fallback';
  const fetchedRoute = useOsrmRoute(props.origin, props.destination);
  const routeToUse = props.route || fetchedRoute;

  const finalProps = { ...props, route: routeToUse };

  if (!useGoogle) {
    return <SimpleMapRenderer {...finalProps} />;
  }

  return <GoogleSmartMap mapProps={finalProps} />;
}

function GoogleSmartMap({ mapProps }: { mapProps: SmartMapProps }) {
  const { isLoaded, loadError } = useGoogleMapsLoader();

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
