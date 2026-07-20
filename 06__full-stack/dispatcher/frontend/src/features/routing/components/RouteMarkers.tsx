import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { LatLngPair } from '../types/routing';
import { originIcon, pickupIcon, dropoffIcon } from '../utils/mapIcons';

interface RouteMarkersProps {
  originLatLng: LatLngPair | null;
  pickupLatLng: LatLngPair | null;
  dropoffLatLng: LatLngPair | null;
  originName?: string;
  pickupName?: string;
  dropoffName?: string;
}

export const RouteMarkers: React.FC<RouteMarkersProps> = ({
  originLatLng,
  pickupLatLng,
  dropoffLatLng,
  originName = 'Current Location',
  pickupName = 'Pickup Location',
  dropoffName = 'Dropoff Location',
}) => {
  return (
    <>
      {originLatLng && (
        <Marker position={originLatLng} icon={originIcon}>
          <Popup className="font-sans">
            <div className="p-1">
              <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold tracking-wider text-white bg-blue-600 rounded">
                CURRENT
              </span>
              <p className="font-bold text-slate-800 text-xs">{originName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {originLatLng[0].toFixed(4)}, {originLatLng[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {pickupLatLng && (
        <Marker position={pickupLatLng} icon={pickupIcon}>
          <Popup className="font-sans">
            <div className="p-1">
              <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold tracking-wider text-white bg-emerald-600 rounded">
                PICKUP
              </span>
              <p className="font-bold text-slate-800 text-xs">{pickupName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {pickupLatLng[0].toFixed(4)}, {pickupLatLng[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {dropoffLatLng && (
        <Marker position={dropoffLatLng} icon={dropoffIcon}>
          <Popup className="font-sans">
            <div className="p-1">
              <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold tracking-wider text-white bg-red-600 rounded">
                DROPOFF
              </span>
              <p className="font-bold text-slate-800 text-xs">{dropoffName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {dropoffLatLng[0].toFixed(4)}, {dropoffLatLng[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};
