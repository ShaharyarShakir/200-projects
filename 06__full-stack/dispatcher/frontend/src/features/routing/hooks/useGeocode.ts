import { useMutation } from '@tanstack/react-query';
import { geocodeAddress } from '../api/routingApi';
import type { GeocodeResponse } from '../types/routing';

export const useGeocode = () => {
  return useMutation<GeocodeResponse, Error, string>({
    mutationFn: geocodeAddress,
  });
};
