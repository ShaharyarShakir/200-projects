import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  optimizeRoute,
  getAlternativeRoutes,
  getStops,
  updateStop,
  createStop,
  deleteStop
} from '../api/optimizationApi';
import type { OptimizeRequest, Stop } from '../types/optimization';

export const OPTIMIZATION_QUERY_KEYS = {
  optimizedTrip: (tripId?: string) => ['optimized-trip', tripId ?? 'ad-hoc'] as const,
  stops: (tripId?: string) => ['stops', tripId ?? 'all'] as const,
  alternatives: (tripId?: string) => ['alternatives', tripId ?? 'none'] as const,
};

export const useOptimizeRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OptimizeRequest) => optimizeRoute(payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(OPTIMIZATION_QUERY_KEYS.optimizedTrip(variables.tripId), data);
      if (variables.tripId) {
        queryClient.invalidateQueries({ queryKey: OPTIMIZATION_QUERY_KEYS.stops(variables.tripId) });
        queryClient.invalidateQueries({ queryKey: OPTIMIZATION_QUERY_KEYS.alternatives(variables.tripId) });
      }
    },
  });
};

export const useOptimizedTrip = (tripId?: string, initialRequest?: OptimizeRequest) => {
  return useQuery({
    queryKey: OPTIMIZATION_QUERY_KEYS.optimizedTrip(tripId),
    queryFn: () => optimizeRoute(initialRequest || { tripId }),
    enabled: !!(tripId || initialRequest),
  });
};

export const useAlternativeRoutes = (tripId?: string) => {
  return useQuery({
    queryKey: OPTIMIZATION_QUERY_KEYS.alternatives(tripId),
    queryFn: () => getAlternativeRoutes(tripId!),
    enabled: !!tripId,
  });
};

export const useStops = (tripId?: string) => {
  return useQuery({
    queryKey: OPTIMIZATION_QUERY_KEYS.stops(tripId),
    queryFn: () => getStops(tripId),
    enabled: !!tripId,
  });
};

export const useUpdateStop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: Partial<Stop> }) =>
      updateStop(stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-trip'] });
    },
  });
};

export const useCreateStop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stopData: Partial<Stop>) => createStop(stopData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-trip'] });
    },
  });
};

export const useDeleteStop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stopId: string) => deleteStop(stopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-trip'] });
    },
  });
};
