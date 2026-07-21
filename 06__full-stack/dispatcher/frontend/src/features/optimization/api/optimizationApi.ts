import { api } from '../../../lib/api';
import type {
  OptimizeRequest,
  OptimizationResult,
  AlternativeRoute,
  Stop
} from '../types/optimization';

export const optimizeRoute = async (payload: OptimizeRequest): Promise<OptimizationResult> => {
  const response = await api.post<OptimizationResult>('/optimization/optimize', payload);
  return response.data;
};

export const getAlternativeRoutes = async (tripId: string): Promise<AlternativeRoute[]> => {
  const response = await api.get<AlternativeRoute[]>(`/optimization/alternatives/${tripId}`);
  return response.data;
};

export const getStops = async (tripId?: string): Promise<Stop[]> => {
  const params = tripId ? { tripId } : {};
  const response = await api.get<Stop[] | { results: Stop[] }>('/optimization/stops', { params });
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.results || [];
};

export const updateStop = async (stopId: string, data: Partial<Stop>): Promise<Stop> => {
  const response = await api.put<Stop>(`/optimization/stops/${stopId}/`, data);
  return response.data;
};

export const createStop = async (stopData: Partial<Stop>): Promise<Stop> => {
  const response = await api.post<Stop>('/optimization/stops/', stopData);
  return response.data;
};

export const deleteStop = async (stopId: string): Promise<void> => {
  await api.delete(`/optimization/stops/${stopId}/`);
};
