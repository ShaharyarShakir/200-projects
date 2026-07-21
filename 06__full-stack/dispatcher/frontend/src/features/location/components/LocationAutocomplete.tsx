import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { CurrentLocationButton } from './CurrentLocationButton';
import { SearchHistory } from './SearchHistory';
import { MapPreview } from './MapPreview';
import type { LocationItem } from '../types/location';


interface LocationAutocompleteProps {
  label: string;
  value: string;
  lat: number | null;
  lng: number | null;
  onChange: (location: { name: string; lat: number; lng: number; place_id?: string }) => void;
  onClear?: () => void;
  placeholder?: string;
  error?: string;
  showMapPreview?: boolean;
  showCurrentLocation?: boolean;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  label,
  value,
  lat,
  lng,
  onChange,
  onClear,
  placeholder = 'Search location...',
  error,
  showMapPreview = true,
  showCurrentLocation = true,
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading, isError } = useLocationSearch(searchTerm);
  const { history, addToHistory, clearHistory } = useSearchHistory();

  const isLocationSelected = Boolean(lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng));

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: LocationItem) => {
    setSearchTerm(item.display_name);
    addToHistory(item);
    onChange({
      name: item.display_name,
      lat: item.lat,
      lng: item.lng,
      place_id: item.place_id,
    });
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    setIsOpen(true);
  };

  const handleInputClear = () => {
    setSearchTerm('');
    if (onClear) {
      onClear();
    }
    setIsOpen(true);
  };

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
          {label}
          {isLocationSelected ? (
            <span className="inline-flex items-center text-[11px] font-normal text-emerald-400 gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          ) : (
            <span className="inline-flex items-center text-[11px] font-normal text-amber-400 gap-0.5">
              <AlertCircle className="w-3 h-3" /> Select from list
            </span>
          )}
        </label>
        {showCurrentLocation && (
          <CurrentLocationButton onSelect={handleSelect} />
        )}
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full bg-neutral-900 border ${
              error
                ? 'border-rose-500/80 focus:border-rose-500'
                : isLocationSelected
                ? 'border-emerald-500/50 focus:border-emerald-400'
                : 'border-neutral-700 focus:border-brand-500'
            } rounded-xl pl-9 pr-8 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 ${
              error ? 'focus:ring-rose-500' : 'focus:ring-brand-500'
            } transition-colors`}
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={handleInputClear}
              className="absolute right-2 text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Dropdown Suggestions & History */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 flex flex-col">
            {isLoading && (
              <div className="flex items-center justify-center p-3 text-xs text-neutral-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>Searching...</span>
              </div>
            )}

            {isError && (
              <div className="p-3 text-xs text-rose-400 text-center">
                Failed to fetch locations. Please try again.
              </div>
            )}

            {!isLoading && !isError && suggestions && suggestions.length > 0 && (
              <div className="overflow-y-auto divide-y divide-neutral-800/80">
                {suggestions.map((item, idx) => (
                  <button
                    key={`${item.place_id}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left p-2.5 hover:bg-neutral-800 transition-colors flex items-start gap-2 group cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-neutral-400 group-hover:text-brand-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-neutral-200 group-hover:text-white font-medium truncate">
                        {item.display_name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && !isError && searchTerm.trim().length >= 2 && suggestions?.length === 0 && (
              <div className="p-3 text-xs text-neutral-400 text-center">
                No results found.
              </div>
            )}

            {/* Search History */}
            <SearchHistory
              history={history}
              onSelect={handleSelect}
              onClear={clearHistory}
            />
          </div>
        )}
      </div>

      {error && <span className="text-xs text-rose-400">{error}</span>}

      {showMapPreview && (
        <MapPreview lat={lat} lng={lng} address={value} />
      )}
    </div>
  );
};
