import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import type { LocationItem } from '../types/location';


interface CurrentLocationButtonProps {
  onSelect: (location: LocationItem) => void;
  className?: string;
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onSelect,
  className = '',
}) => {
  const { getCurrentLocation, loading, error } = useCurrentLocation();

  const handleClick = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      onSelect(loc);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : (
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>📍 Use Current Location</span>
      </button>
      {error && <span className="text-[11px] text-rose-400">{error}</span>}
    </div>
  );
};
