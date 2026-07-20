import { api } from '../../../lib/api';
import type { GeocodeResponse, RouteRequest, RouteResponse } from '../types/routing';

export const geocodeAddress = async (address: string): Promise<GeocodeResponse> => {
  const response = await api.post<GeocodeResponse>('/routing/geocode', { address });
  return response.data;
};

export const calculateRoute = async (payload: RouteRequest): Promise<RouteResponse> => {
  const response = await api.post<RouteResponse>('/routing/route', payload);
  return response.data;
};

export const getRouteByTripId = async (tripId: string): Promise<RouteResponse> => {
  const response = await api.get<RouteResponse>(`/routing/${tripId}`);
  return response.data;
};
