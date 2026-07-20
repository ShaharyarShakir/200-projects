import React from 'react';
import { Polyline } from 'react-leaflet';
import type { LatLngPair } from '../types/routing';

interface RoutePolylineProps {
  geometry: LatLngPair[] | null;
  color?: string;
  weight?: number;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  geometry,
  color = '#2563eb', // Blue-600 primary route line
  weight = 5,
}) => {
  if (!geometry || geometry.length === 0) return null;

  return (
    <>
      {/* Outer halo / shadow line for high contrast */}
      <Polyline
        positions={geometry}
        pathOptions={{
          color: '#1e3a8a',
          weight: weight + 3,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Core vibrant route polyline */}
      <Polyline
        positions={geometry}
        pathOptions={{
          color: color,
          weight: weight,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </>
  );
};
