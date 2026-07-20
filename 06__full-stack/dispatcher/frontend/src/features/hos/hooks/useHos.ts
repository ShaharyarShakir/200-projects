import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hosApi } from '../api/hosApi';
import type { HOSGeneratePayload, HOSScheduleResponse, TripScheduleResponse } from '../types/hos';

export const useGenerateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation<HOSScheduleResponse, Error, HOSGeneratePayload>({
    mutationFn: (payload: HOSGeneratePayload) => hosApi.generateSchedule(payload),
    onSuccess: (data) => {
      if (data.trip_id) {
        queryClient.invalidateQueries({ queryKey: ['schedule', data.trip_id] });
        queryClient.invalidateQueries({ queryKey: ['timeline', data.trip_id] });
        queryClient.invalidateQueries({ queryKey: ['trips'] });
      }
    },
  });
};

export const useTripSchedule = (tripId?: string) => {
  return useQuery<TripScheduleResponse, Error>({
    queryKey: ['schedule', tripId],
    queryFn: () => {
      if (!tripId) throw new Error('Trip ID is required');
      return hosApi.getTripSchedule(tripId);
    },
    enabled: Boolean(tripId),
  });
};
