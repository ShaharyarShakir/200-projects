import { useQuery } from '@tanstack/react-query';
import { getRouteByTripId } from '../api/routingApi';
import type { RouteResponse } from '../types/routing';

export const useRouteDetail = (tripId?: string) => {
  return useQuery<RouteResponse, Error>({
    queryKey: ['route', tripId],
    queryFn: () => getRouteByTripId(tripId!),
    enabled: !!tripId,
    staleTime: 15 * 60 * 1000, // 15 minutes cache
  });
};
