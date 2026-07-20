import { api } from '../../../lib/api';
import type { Trip, CreateTripPayload, UpdateTripPayload, TripQueryParams, PaginatedTripResponse } from '../types/trip';

export const tripApi = {
  getTrips: async (params?: TripQueryParams): Promise<PaginatedTripResponse | Trip[]> => {
    const response = await api.get('/trips/', { params });
    return response.data;
  },

  getTrip: async (id: string): Promise<Trip> => {
    const response = await api.get(`/trips/${id}/`);
    return response.data;
  },

  createTrip: async (payload: CreateTripPayload): Promise<Trip> => {
    const response = await api.post('/trips/', payload);
    return response.data;
  },

  updateTrip: async (id: string, payload: UpdateTripPayload): Promise<Trip> => {
    const response = await api.patch(`/trips/${id}/`, payload);
    return response.data;
  },

  deleteTrip: async (id: string): Promise<void> => {
    await api.delete(`/trips/${id}/`);
  },
};
