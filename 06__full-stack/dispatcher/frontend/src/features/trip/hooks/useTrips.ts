import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripApi } from '../api/tripApi';
import { useAuth } from '../../auth/context/AuthContext';
import type { CreateTripPayload, UpdateTripPayload, TripQueryParams } from '../types/trip';

export const TRIP_QUERY_KEYS = {
  all: ['trips'] as const,
  list: (params?: TripQueryParams) => ['trips', 'list', params] as const,
  detail: (id: string) => ['trips', 'detail', id] as const,
};

export const useTrips = (params?: TripQueryParams, options?: { enabled?: boolean }) => {
  const { isAuthenticated } = useAuth();
  const isEnabled = (options?.enabled ?? true) && isAuthenticated;

  return useQuery({
    queryKey: TRIP_QUERY_KEYS.list(params),
    queryFn: () => tripApi.getTrips(params),
    enabled: isEnabled,
  });
};

export const useTrip = (id: string | null, options?: { enabled?: boolean }) => {
  const { isAuthenticated } = useAuth();
  const isEnabled = (options?.enabled ?? true) && isAuthenticated && Boolean(id);

  return useQuery({
    queryKey: TRIP_QUERY_KEYS.detail(id || ''),
    queryFn: () => tripApi.getTrip(id!),
    enabled: isEnabled,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTripPayload) => tripApi.createTrip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.all });
    },
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTripPayload }) =>
      tripApi.updateTrip(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.detail(data.id) });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tripApi.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_QUERY_KEYS.all });
    },
  });
};
