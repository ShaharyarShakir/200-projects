import { api } from '../../../lib/api';
import type { HOSGeneratePayload, HOSScheduleResponse, TripScheduleResponse } from '../types/hos';

export const hosApi = {
  generateSchedule: async (payload: HOSGeneratePayload): Promise<HOSScheduleResponse> => {
    const response = await api.post('/hos/generate/', payload);
    return response.data;
  },

  getTripSchedule: async (tripId: string): Promise<TripScheduleResponse> => {
    const response = await api.get(`/hos/schedule/${tripId}/`);
    return response.data;
  },
};
