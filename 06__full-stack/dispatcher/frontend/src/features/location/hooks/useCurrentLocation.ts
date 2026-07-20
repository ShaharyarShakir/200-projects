import { useState, useCallback } from 'react';
import { reverseGeocode } from '../api/geocoding';
import type { LocationItem } from '../types/location';


export const useCurrentLocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<LocationItem | null> => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const locationItem = await reverseGeocode(lat, lng);
      setLoading(false);
      return locationItem;
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Please enable location.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information unavailable.');
        } else {
          setError('Location request timed out.');
        }
      } else {
        setError('Please enable location.');
      }
      return null;
    }
  }, []);

  return {
    getCurrentLocation,
    loading,
    error,
  };
};
