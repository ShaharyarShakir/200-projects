import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { CoordinatePair, LatLngPair, DirectionStep } from '../types/routing';
import { RouteMarkers } from './RouteMarkers';
import { RoutePolyline } from './RoutePolyline';
import { FitBounds } from './FitBounds';
import { MapControls } from './MapControls';
import { DirectionsPanel } from './DirectionsPanel';
import { Loader2, Layers } from 'lucide-react';

interface RouteMapProps {
  originCoords: CoordinatePair | null;
  pickupCoords: CoordinatePair | null;
  dropoffCoords: CoordinatePair | null;
  originName?: string;
  pickupName?: string;
  dropoffName?: string;
  geometry: LatLngPair[] | null;
  bbox?: number[] | null;
  steps?: DirectionStep[] | null;
  isLoading: boolean;
  onRecalculate?: () => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  originCoords,
  pickupCoords,
  dropoffCoords,
  originName = 'Current Location',
  pickupName = 'Pickup Location',
  dropoffName = 'Dropoff Location',
  geometry,
  bbox,
  steps,
  isLoading,
  onRecalculate,
}) => {
  const defaultCenter: LatLngPair = [31.5204, 74.3587]; // Lahore default
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [resetViewKey, setResetViewKey] = useState(0);

  const originLatLng: LatLngPair | null = originCoords ? [originCoords[1], originCoords[0]] : null;
  const pickupLatLng: LatLngPair | null = pickupCoords ? [pickupCoords[1], pickupCoords[0]] : null;
  const dropoffLatLng: LatLngPair | null = dropoffCoords ? [dropoffCoords[1], dropoffCoords[0]] : null;

  const allPoints: LatLngPair[] = [
    ...(originLatLng ? [originLatLng] : []),
    ...(pickupLatLng ? [pickupLatLng] : []),
    ...(dropoffLatLng ? [dropoffLatLng] : []),
    ...(geometry || []),
  ];

  const handleResetView = () => {
    setResetViewKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex">
      {/* Map Content Area */}
      <div className="relative flex-1 h-full">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-400 gap-3 font-medium text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <div className="text-center space-y-1">
              <span className="font-bold text-slate-100 text-sm">Calculating Optimal Truck Route...</span>
              <p className="text-slate-400 text-xs">Evaluating OpenRouteService geometry and turn directions</p>
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-slate-100">Layers</span>
          </div>
          <span className="h-3 w-px bg-slate-700"></span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Current
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pickup
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Dropoff
          </span>
        </div>

        {/* Leaflet Map */}
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

          <RouteMarkers
            originLatLng={originLatLng}
            pickupLatLng={pickupLatLng}
            dropoffLatLng={dropoffLatLng}
            originName={originName}
            pickupName={pickupName}
            dropoffName={dropoffName}
          />

          <RoutePolyline geometry={geometry} />

          {allPoints.length > 0 && (
            <FitBounds key={resetViewKey} coordsList={allPoints} bbox={bbox} />
          )}

          <MapControls
            onResetView={handleResetView}
            onRecalculate={onRecalculate}
            onToggleDirections={() => setIsDirectionsOpen(!isDirectionsOpen)}
            showDirectionsToggle={!!steps && steps.length > 0}
            isDirectionsOpen={isDirectionsOpen}
          />
        </MapContainer>
      </div>

      {/* Turn-by-Turn Directions Panel */}
      <DirectionsPanel
        steps={steps}
        isOpen={isDirectionsOpen}
        onClose={() => setIsDirectionsOpen(false)}
      />
    </div>
  );
};
