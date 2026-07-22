import React from 'react';
import type { RouteResponse } from '../types/routing';
import { formatDistance, formatDuration, calculateAverageSpeed } from '../utils/formatters';
import { Gauge, Clock, MapPin, Milestone } from 'lucide-react';

interface TripSummaryProps {
  routeData: RouteResponse | null;
  isLoading: boolean;
}

export const TripSummary: React.FC<TripSummaryProps> = ({ routeData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md animate-pulse space-y-4">
        <div className="h-5 bg-neutral-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-neutral-800 rounded-xl"></div>
          <div className="h-20 bg-neutral-800 rounded-xl"></div>
          <div className="h-20 bg-neutral-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return (
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md text-center space-y-2">
        <Milestone className="w-8 h-8 text-neutral-400 mx-auto" />
        <p className="text-sm font-semibold text-neutral-200">No Route Calculated Yet</p>
        <p className="text-xs text-neutral-400">Enter locations above and click "Calculate Route" to compute trip distance and duration.</p>
      </div>
    );
  }

  const distanceFormatted = formatDistance(routeData.distance);
  const durationFormatted = formatDuration(routeData.duration);
  const avgSpeed = calculateAverageSpeed(routeData.distance, routeData.duration);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-lg font-bold text-neutral-100 tracking-tight flex items-center gap-2">
          <Milestone className="w-5 h-5 text-brand-400" /> Calculated Trip Metrics
        </h3>
        <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
          Route Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Distance Card */}
        <div className="bg-neutral-800/60 border border-neutral-750 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Total Distance</p>
            <p className="text-xl font-bold text-neutral-100 font-mono mt-0.5">{distanceFormatted}</p>
          </div>
        </div>

        {/* Duration Card */}
        <div className="bg-neutral-800/60 border border-neutral-750 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Estimated Drive Time</p>
            <p className="text-xl font-bold text-neutral-100 font-mono mt-0.5">{durationFormatted}</p>
          </div>
        </div>

        {/* Avg Speed Card */}
        <div className="bg-neutral-800/60 border border-neutral-750 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Avg Driving Speed</p>
            <p className="text-xl font-bold text-neutral-100 font-mono mt-0.5">{avgSpeed} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};
