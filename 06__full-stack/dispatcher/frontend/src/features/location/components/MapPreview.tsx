import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPreviewProps {
  lat: number | null;
  lng: number | null;
  address?: string;
  zoom?: number;
  height?: string;
  className?: string;
}

const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const MapPreview: React.FC<MapPreviewProps> = ({
  lat,
  lng,
  address,
  zoom = 13,
  height = '140px',
  className = '',
}) => {
  if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
    return (
      <div
        style={{ height }}
        className={`w-full rounded-lg border border-slate-800 bg-slate-950/50 flex flex-col items-center justify-center p-3 text-slate-500 text-xs ${className}`}
      >
        <span>No location selected for map preview</span>
      </div>
    );
  }

  const center: [number, number] = [lat, lng];

  return (
    <div className={`w-full rounded-lg overflow-hidden border border-slate-700/80 shadow-md ${className}`}>
      <div style={{ height }} className="w-full relative z-0">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={center} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={center}>
            {address && (
              <Popup>
                <div className="text-xs font-medium text-slate-800">{address}</div>
              </Popup>
            )}
          </Marker>
        </MapContainer>
      </div>
      {address && (
        <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 text-[11px] text-slate-300 truncate">
          <span className="font-semibold text-emerald-400">Selected: </span>
          {address} ({lat.toFixed(4)}, {lng.toFixed(4)})
        </div>
      )}
    </div>
  );
};
