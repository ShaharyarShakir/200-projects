import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Stop, StopCategory } from '../types/optimization';

interface StopMapMarkersProps {
  stops: Stop[];
  activeStopId?: string;
  onSelectStop?: (stop: Stop) => void;
}

const createCustomMarkerIcon = (category: StopCategory, isLocked: boolean, isSelected: boolean) => {
  let bgColor = 'bg-purple-500';
  let label = 'P';

  switch (category) {
    case 'Fuel':
      bgColor = 'bg-emerald-500';
      label = 'F';
      break;
    case 'Rest Area':
      bgColor = 'bg-amber-400 text-neutral-950';
      label = 'R';
      break;
    case 'Hotel':
      bgColor = 'bg-sky-500';
      label = 'H';
      break;
    case 'Truck Stop':
    case 'Parking':
      bgColor = 'bg-purple-500';
      label = 'P';
      break;
    case 'Food':
      bgColor = 'bg-orange-500';
      label = 'D';
      break;
    default:
      bgColor = 'bg-red-500';
      label = 'S';
      break;
  }

  const borderClass = isSelected
    ? 'ring-4 ring-emerald-400 scale-125 z-50'
    : 'border-2 border-neutral-900';

  const html = `
    <div class="relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg font-bold text-xs text-white ${bgColor} ${borderClass}">
      ${label}
      ${isLocked ? '<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-neutral-900"></span>' : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-stop-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const StopMapMarkers: React.FC<StopMapMarkersProps> = ({
  stops,
  activeStopId,
  onSelectStop,
}) => {
  return (
    <>
      {stops.map((stop) => {
        if (!stop.latitude || !stop.longitude) return null;

        const isSelected = stop.id === activeStopId;
        const icon = createCustomMarkerIcon(stop.category, stop.is_locked, isSelected);

        return (
          <Marker
            key={stop.id}
            position={[stop.latitude, stop.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectStop && onSelectStop(stop),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px] text-neutral-100">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                    {stop.category}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">Mile {stop.distance_from_start}</span>
                </div>

                <h4 className="font-bold text-sm text-neutral-100 leading-tight mb-1.5">{stop.name}</h4>

                <div className="text-xs text-neutral-300 space-y-1">
                  <p className="text-neutral-400">Duration: <span className="text-neutral-200 font-medium">{stop.duration * 60} minutes</span></p>
                  {stop.metadata?.rating && (
                    <p className="flex items-center gap-1 text-amber-400 font-semibold">
                      ★ {stop.metadata.rating} Rating
                    </p>
                  )}
                  {stop.metadata?.fuel_price && stop.metadata.fuel_price > 0 && (
                    <p className="font-bold text-emerald-400">
                      Diesel: ${stop.metadata.fuel_price}/gal
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
