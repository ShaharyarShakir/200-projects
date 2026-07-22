import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Stop } from '../types/optimization';
import type { LatLngPair } from '../../routing/types/routing';
import { StopMapMarkers } from './StopMapMarkers';
import { RoutePolyline } from '../../routing/components/RoutePolyline';
import { FitBounds } from '../../routing/components/FitBounds';
import { MapPin } from 'lucide-react';

interface StopMapProps {
  stops: Stop[];
  geometry?: LatLngPair[] | null;
  activeStopId?: string;
  onSelectStop?: (stop: Stop) => void;
  isLoading?: boolean;
}

export const StopMap: React.FC<StopMapProps> = ({
  stops,
  geometry,
  activeStopId,
  onSelectStop,
}) => {
  const defaultCenter: LatLngPair = [32.7767, -96.7970]; // Dallas default

  const stopCoords: LatLngPair[] = stops
    .filter((s) => s.latitude && s.longitude)
    .map((s) => [s.latitude, s.longitude]);

  const allPoints: LatLngPair[] = [...(geometry || []), ...stopCoords];

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950">
      {/* Category Marker Color Legend Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-neutral-900/95 backdrop-blur-md border border-neutral-700/60 rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-200 shadow-xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-neutral-100">
          <MapPin className="w-4 h-4 text-brand-400" />
          <span>Stop Categories</span>
        </div>
        <span className="h-3 w-px bg-neutral-700"></span>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 🟢 Fuel
        </span>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> 🟡 Rest Area
        </span>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 🔵 Hotel
        </span>
        <span className="flex items-center gap-1 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> 🟣 Parking / Truck Stop
        </span>
      </div>

      <MapContainer
        center={stopCoords[0] || defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        />

        <RoutePolyline geometry={geometry || null} />

        <StopMapMarkers stops={stops} activeStopId={activeStopId} onSelectStop={onSelectStop} />

        {allPoints.length > 0 && <FitBounds coordsList={allPoints} />}
      </MapContainer>
    </div>
  );
};
