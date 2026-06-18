'use client';

import { useEffect, useState } from 'react';

let loadPromise: Promise<void> | null = null;

export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(
    () => typeof window !== 'undefined' && !!window.google?.maps
  );
  const [loadError, setLoadError] = useState<Error | Event | null>(null);

  useEffect(() => {
    if (isLoaded) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      setTimeout(() => setLoadError(new Error('Google Maps API key is missing')), 0);
      return;
    }

    if (!loadPromise) {
      loadPromise = new Promise((resolve, reject) => {
        const id = 'google-maps-script-loader';
        const existingScript = document.getElementById(id);
        if (existingScript) {
          // Script tag exists, wait for it
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', (e) => reject(e));
          return;
        }

        const script = document.createElement('script');
        script.id = id;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', (e) => reject(e));
        document.head.appendChild(script);
      });
    }

    loadPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        setLoadError(err);
      });
  }, [isLoaded]);

  return { isLoaded, loadError };
}
