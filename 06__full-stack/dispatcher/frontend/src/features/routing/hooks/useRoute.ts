import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calculateRoute } from '../api/routingApi';
import type { RouteRequest, RouteResponse } from '../types/routing';

export const useCalculateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation<RouteResponse, Error, RouteRequest>({
    mutationFn: calculateRoute,
    onSuccess: (data, variables) => {
      const originKey = Array.isArray(variables.origin)
        ? variables.origin.join(',')
        : variables.current && Array.isArray(variables.current)
        ? variables.current.join(',')
        : JSON.stringify(variables.origin || variables.current);
      
      const pickupKey = Array.isArray(variables.pickup)
        ? variables.pickup.join(',')
        : JSON.stringify(variables.pickup);

      const dropoffKey = Array.isArray(variables.dropoff)
        ? variables.dropoff.join(',')
        : JSON.stringify(variables.dropoff);

      const cacheKey = ['route', originKey, pickupKey, dropoffKey];
      queryClient.setQueryData(cacheKey, data);
    },
  });
};

export const useRoute = useCalculateRoute;
