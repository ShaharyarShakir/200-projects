import React, { useState } from 'react';
import { MapPin, Search, Navigation, AlertCircle, Sparkles } from 'lucide-react';
import type { CoordinatePair } from '../types/routing';
import { useGeocode } from '../hooks/useGeocode';

interface TripFormProps {
  onCalculateRoute: (values: {
    origin: CoordinatePair;
    pickup: CoordinatePair;
    dropoff: CoordinatePair;
  }) => void;
  isLoading: boolean;
  errorMsg: string | null;
}

export const TripForm: React.FC<TripFormProps> = ({ onCalculateRoute, isLoading, errorMsg }) => {
  const [originText, setOriginText] = useState('Lahore');
  const [pickupText, setPickupText] = useState('Rawalpindi');
  const [dropoffText, setDropoffText] = useState('Islamabad');

  const [validationError, setValidationError] = useState<string | null>(null);

  const geocodeMutation = useGeocode();

  const handleQuickPreset = (origin: string, pickup: string, dropoff: string) => {
    setOriginText(origin);
    setPickupText(pickup);
    setDropoffText(dropoff);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!originText.trim() || !pickupText.trim() || !dropoffText.trim()) {
      setValidationError('Please provide all three locations: Origin, Pickup, and Dropoff.');
      return;
    }

    try {
      const originResult = await geocodeMutation.mutateAsync(originText);
      const pickupResult = await geocodeMutation.mutateAsync(pickupText);
      const dropoffResult = await geocodeMutation.mutateAsync(dropoffText);

      onCalculateRoute({
        origin: [originResult.lng, originResult.lat],
        pickup: [pickupResult.lng, pickupResult.lat],
        dropoff: [dropoffResult.lng, dropoffResult.lat],
      });
    } catch (err: any) {
      setValidationError(err.message || 'Geocoding failed for one or more addresses.');
    }
  };

  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Navigation className="w-5 h-5 text-brand-600" /> Route Calculation Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Enter city names or addresses to geocode locations and calculate driving distance & HOS ETA.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-neutral-400 font-medium self-center">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickPreset('Lahore', 'Rawalpindi', 'Islamabad')}
            className="px-2.5 py-1 bg-neutral-0 hover:bg-brand-50 text-neutral-800 hover:text-brand-600 border border-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-brand-600" /> LHR → RWP → ISB
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('Karachi', 'Hyderabad', 'Multan')}
            className="px-2.5 py-1 bg-neutral-0 hover:bg-brand-50 text-neutral-800 hover:text-brand-600 border border-neutral-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-brand-600" /> KHI → HYD → MUX
          </button>
        </div>
      </div>

      {(validationError || errorMsg) && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-3.5 text-xs text-error-600 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-error-600 shrink-0" />
          <span>{validationError || errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Origin Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-600"></span> Current / Origin Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-brand-600 absolute left-3 top-3" />
              <input
                type="text"
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="e.g. Lahore, Pakistan"
                className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Pickup Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success-600"></span> Pickup Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-success-600 absolute left-3 top-3" />
              <input
                type="text"
                value={pickupText}
                onChange={(e) => setPickupText(e.target.value)}
                placeholder="e.g. Rawalpindi, Pakistan"
                className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Dropoff Input */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error-600"></span> Dropoff Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-error-600 absolute left-3 top-3" />
              <input
                type="text"
                value={dropoffText}
                onChange={(e) => setDropoffText(e.target.value)}
                placeholder="e.g. Islamabad, Pakistan"
                className="w-full bg-neutral-0 border border-neutral-200 focus:border-brand-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading || geocodeMutation.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-neutral-0 font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {isLoading || geocodeMutation.isPending ? 'Processing Route...' : 'Calculate Route & Draw Map'}
          </button>
        </div>
      </form>
    </div>
  );
};
