import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CoordinatePair, LatLngPair } from '../types/routing';
import { originIcon, pickupIcon, dropoffIcon } from '../utils/mapIcons';
import { Loader2 } from 'lucide-react';

interface RouteMapProps {
  originCoords: CoordinatePair | null;
  pickupCoords: CoordinatePair | null;
  dropoffCoords: CoordinatePair | null;
  geometry: LatLngPair[] | null;
  isLoading: boolean;
}

const MapFitBounds: React.FC<{
  coordsList: LatLngPair[];
}> = ({ coordsList }) => {
  const map = useMap();

  useEffect(() => {
    if (coordsList && coordsList.length > 0) {
      const bounds = L.latLngBounds(coordsList);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coordsList, map]);

  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({
  originCoords,
  pickupCoords,
  dropoffCoords,
  geometry,
  isLoading,
}) => {
  const defaultCenter: [number, number] = [31.5204, 74.3587]; // Lahore default

  const originLatLng: LatLngPair | null = originCoords ? [originCoords[1], originCoords[0]] : null;
  const pickupLatLng: LatLngPair | null = pickupCoords ? [pickupCoords[1], pickupCoords[0]] : null;
  const dropoffLatLng: LatLngPair | null = dropoffCoords ? [dropoffCoords[1], dropoffCoords[0]] : null;

  const allPoints: LatLngPair[] = [
    ...(originLatLng ? [originLatLng] : []),
    ...(pickupLatLng ? [pickupLatLng] : []),
    ...(dropoffLatLng ? [dropoffLatLng] : []),
    ...(geometry || []),
  ];

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-neutral-200 shadow-2xl bg-neutral-50">
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-neutral-0/70 backdrop-blur-sm flex items-center justify-center text-brand-600 gap-2 font-medium text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Calculating route polylines...</span>
        </div>
      )}

      <MapContainer
        center={originLatLng || defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {originLatLng && (
          <Marker position={originLatLng} icon={originIcon}>
            <Popup className="font-sans">
              <strong className="text-brand-600">Origin Location</strong>
              <br />
              [{originLatLng[0].toFixed(4)}, {originLatLng[1].toFixed(4)}]
            </Popup>
          </Marker>
        )}

        {pickupLatLng && (
          <Marker position={pickupLatLng} icon={pickupIcon}>
            <Popup className="font-sans">
              <strong className="text-success-600">Pickup Location</strong>
              <br />
              [{pickupLatLng[0].toFixed(4)}, {pickupLatLng[1].toFixed(4)}]
            </Popup>
          </Marker>
        )}

        {dropoffLatLng && (
          <Marker position={dropoffLatLng} icon={dropoffIcon}>
            <Popup className="font-sans">
              <strong className="text-error-600">Dropoff Location</strong>
              <br />
              [{dropoffLatLng[0].toFixed(4)}, {dropoffLatLng[1].toFixed(4)}]
            </Popup>
          </Marker>
        )}

        {geometry && geometry.length > 0 && (
          <Polyline
            positions={geometry}
            pathOptions={{ color: '#05a2c2', weight: 5, opacity: 0.8 }}
          />
        )}

        {allPoints.length > 0 && <MapFitBounds coordsList={allPoints} />}
      </MapContainer>
    </div>
  );
};
