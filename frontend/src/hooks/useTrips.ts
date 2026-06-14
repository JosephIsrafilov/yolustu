/**
 * React Query hooks for trip data fetching.
 *
 * Replaces the Zustand fetchTrips / fetchMyTrips actions for read operations.
 * Write mutations (createTrip, cancelTrip, completeTrip, deleteTrip) remain
 * in the Zustand store since they update shared app state optimistically.
 *
 * Usage
 * -----
 *   // Infinite paginated search (load-more style)
 *   const { data, fetchNextPage, hasNextPage, isLoading } = useSearchTrips(filters);
 *   const trips = data?.pages.flatMap(p => p.items) ?? [];
 *
 *   // Flat first-page search (drop-in replacement for fetchTrips)
 *   const { data: trips = [], isLoading } = useTripsPage(filters);
 *
 *   // My trips
 *   const { data: myTrips = [], isLoading } = useMyTrips();
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tripsService } from '@/services';
import type { TripSearchFilters } from '@/types';

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────

export const tripKeys = {
  all: ['trips'] as const,
  search: (filters: TripSearchFilters) => ['trips', 'search', filters] as const,
  myTrips: () => ['trips', 'my'] as const,
  detail: (id: string) => ['trips', 'detail', id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// useSearchTrips — infinite pagination (load-more UX)
// ─────────────────────────────────────────────────────────────────────────────

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
    staleTime: 3 * 60 * 1000,   // 3 minutes — matches backend cache TTL
    gcTime: 10 * 60 * 1000,     // Keep in cache for 10 minutes after unmount
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useTripsPage — single page (simpler drop-in replacement)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// useMyTrips — driver's own trips
// ─────────────────────────────────────────────────────────────────────────────

export function useMyTrips(enabled = true) {
  return useQuery({
    queryKey: tripKeys.myTrips(),
    queryFn: () => tripsService.getMyTrips(),
    enabled,
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 10 * 60 * 1000,
  });
}
