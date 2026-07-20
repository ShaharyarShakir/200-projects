import { useQuery } from '@tanstack/react-query';
import { reverseGeocode } from '../api/geocoding';
import type { LocationItem } from '../types/location';


export const useReverseGeocode = (lat: number | null, lng: number | null) => {
  return useQuery<LocationItem>({
    queryKey: ['location-reverse', lat, lng],
    queryFn: () => reverseGeocode(lat!, lng!),
    enabled: lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng),
    staleTime: 10 * 60 * 1000,
  });
};
