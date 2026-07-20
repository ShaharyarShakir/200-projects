import { api } from '@/lib/api';
import type { LocationItem } from '../types/location';


export const searchLocations = async (query: string): Promise<LocationItem[]> => {
  if (!query || query.trim().length === 0) return [];
  const response = await api.get<LocationItem[]>('/routing/search', {
    params: { q: query.trim() },
  });
  return response.data;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<LocationItem> => {
  const response = await api.get<LocationItem>('/routing/reverse', {
    params: { lat, lng },
  });
  return response.data;
};
