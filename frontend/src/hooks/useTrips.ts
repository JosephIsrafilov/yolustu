/**
 * React Query hooks for trip data fetching.
 * Infinite pagination (load-more), single-page, and driver's own trips.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tripsService } from '@/services';
import type { TripSearchFilters } from '@/types';

const PAGE_SIZE = 20;

export const tripKeys = {
  all: ['trips'] as const,
  search: (filters: TripSearchFilters) => ['trips', 'search', filters] as const,
  myTrips: () => ['trips', 'my'] as const,
  detail: (id: string) => ['trips', 'detail', id] as const,
};

export function useSearchTrips(filters: TripSearchFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: tripKeys.search(filters),
    queryFn: ({ pageParam = 0, signal }) =>
      tripsService.searchTrips(
        { ...filters, limit: PAGE_SIZE, offset: pageParam as number },
        { signal },
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.page * lastPage.size;
      return nextOffset < lastPage.total ? nextOffset : undefined;
    },
    enabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches the first page of search results.
 * Returns `data` as `Trip[]` for components that don't need pagination controls.
 */
export function useTripsPage(filters: TripSearchFilters, enabled = true) {
  return useQuery({
    queryKey: tripKeys.search(filters),
    queryFn: ({ signal }) =>
      tripsService.searchTrips(
        { ...filters, limit: PAGE_SIZE, offset: 0 },
        { signal },
      ).then((r) => r.items),
    enabled,
    staleTime: 3 * 60 * 1000,
  });
}

export function useMyTrips(enabled = true) {
  return useQuery({
    queryKey: tripKeys.myTrips(),
    queryFn: () => tripsService.getMyTrips(),
    enabled,
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
}
