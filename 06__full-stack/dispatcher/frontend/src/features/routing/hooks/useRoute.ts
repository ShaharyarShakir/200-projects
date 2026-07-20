import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateRoute } from '../api/routingApi';
import type { RouteRequest, RouteResponse } from '../types/routing';

export const useRoute = () => {
  const queryClient = useQueryClient();

  return useMutation<RouteResponse, Error, RouteRequest>({
    mutationFn: calculateRoute,
    onSuccess: (data, variables) => {
      // Cache calculated route by coordinates key for quick subsequent retrieval
      const cacheKey = ['route', variables.origin.join(','), variables.pickup.join(','), variables.dropoff.join(',')];
      queryClient.setQueryData(cacheKey, data);
    },
  });
};
