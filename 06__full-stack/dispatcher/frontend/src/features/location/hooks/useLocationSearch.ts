import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchLocations } from '../api/geocoding';
import type { LocationItem } from '../types/location';


export const useLocationSearch = (searchTerm: string) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const query = useQuery<LocationItem[]>({
    queryKey: ['locations', debouncedSearch],
    queryFn: () => searchLocations(debouncedSearch),
    enabled: Boolean(debouncedSearch && debouncedSearch.trim().length >= 2),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 15 * 60 * 1000,
  });

  return {
    ...query,
    debouncedSearch,
  };
};
