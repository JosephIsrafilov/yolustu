import { useState, useEffect } from 'react';

export function getCurvedPath(origin: [number, number], destination: [number, number]) {
  // basic straight line for fallback
  return [origin, destination];
}

interface OsrmRouteResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

export function useOsrmRoute(origin?: { lat: number; lng: number }, destination?: { lat: number; lng: number }) {
  const [routeData, setRouteData] = useState<{
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    path: [number, number][];
  }>({ path: [] });

  useEffect(() => {
    if (!origin || !destination) {
      return;
    }

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
        setRouteData({
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: destination.lat,
          destLng: destination.lng,
          path: coordinates.map(([lng, lat]) => [lat, lng]),
        });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Route geometry error:', error);
      });

    return () => controller.abort();
  }, [origin, destination]);

  if (!origin || !destination) {
    return [];
  }

  if (
    routeData.path.length > 0 &&
    routeData.originLat === origin.lat &&
    routeData.originLng === origin.lng &&
    routeData.destLat === destination.lat &&
    routeData.destLng === destination.lng
  ) {
    return routeData.path;
  }

  return getCurvedPath([origin.lat, origin.lng], [destination.lat, destination.lng]);
}

export function useOsrmMultipleRoutes(
  trips: Array<{ id: string; origin?: { lat: number; lng: number }; destination?: { lat: number; lng: number } }>
) {
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      const validTrips = trips.filter((t) => t.origin && t.destination).slice(0, 20);
      const newRoutes: Record<string, [number, number][]> = {};

      for (const trip of validTrips) {
        if (!active) break;
        const origin = trip.origin!;
        const destination = trip.destination!;
        try {
          const params = new URLSearchParams({ overview: 'full', geometries: 'geojson' });
          const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = (await res.json()) as OsrmRouteResponse;
            const coords = data.routes?.[0]?.geometry?.coordinates ?? [];
            newRoutes[trip.id] = coords.map(([lng, lat]) => [lat, lng]);
          } else {
            newRoutes[trip.id] = getCurvedPath([origin.lat, origin.lng], [destination.lat, destination.lng]);
          }
        } catch {
          newRoutes[trip.id] = getCurvedPath([origin.lat, origin.lng], [destination.lat, destination.lng]);
        }
      }
      if (active) {
        setRoutes((prev) => ({ ...prev, ...newRoutes }));
      }
    };

    fetchAll();
    return () => {
      active = false;
    };
  }, [trips]);

  return routes;
}
