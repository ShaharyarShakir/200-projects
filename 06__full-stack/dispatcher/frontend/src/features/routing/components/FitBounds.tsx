import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngPair } from '../types/routing';

interface FitBoundsProps {
  coordsList: LatLngPair[];
  bbox?: number[] | null;
  padding?: [number, number];
}

export const FitBounds: React.FC<FitBoundsProps> = ({
  coordsList,
  bbox,
  padding = [50, 50],
}) => {
  const map = useMap();

  useEffect(() => {
    if (bbox && bbox.length === 4) {
      // bbox format: [min_lng, min_lat, max_lng, max_lat]
      const bounds = L.latLngBounds(
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
      );
      map.fitBounds(bounds, { padding });
    } else if (coordsList && coordsList.length > 0) {
      const bounds = L.latLngBounds(coordsList);
      map.fitBounds(bounds, { padding });
    }
  }, [coordsList, bbox, map, padding]);

  return null;
};
