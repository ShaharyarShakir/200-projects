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
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl animate-pulse space-y-4">
        <div className="h-5 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-neutral-200 rounded-xl"></div>
          <div className="h-20 bg-neutral-200 rounded-xl"></div>
          <div className="h-20 bg-neutral-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return (
      <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl text-center space-y-2">
        <Milestone className="w-8 h-8 text-neutral-400 mx-auto" />
        <p className="text-sm font-semibold text-neutral-800">No Route Calculated Yet</p>
        <p className="text-xs text-neutral-400">Enter locations above and click "Calculate Route" to compute trip distance and duration.</p>
      </div>
    );
  }

  const distanceFormatted = formatDistance(routeData.distance);
  const durationFormatted = formatDuration(routeData.duration);
  const avgSpeed = calculateAverageSpeed(routeData.distance, routeData.duration);

  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Milestone className="w-5 h-5 text-brand-600" /> Calculated Trip Metrics
        </h3>
        <span className="text-xs px-2.5 py-1 bg-success-50 text-success-600 border border-success-200 rounded-full font-medium">
          Route Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Distance Card */}
        <div className="bg-neutral-0/80 border border-neutral-200 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-600">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Total Distance</p>
            <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">{distanceFormatted}</p>
          </div>
        </div>

        {/* Duration Card */}
        <div className="bg-neutral-0/80 border border-neutral-200 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-xl text-warning-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Estimated Drive Time</p>
            <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">{durationFormatted}</p>
          </div>
        </div>

        {/* Avg Speed Card */}
        <div className="bg-neutral-0/80 border border-neutral-200 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-success-50 border border-success-200 rounded-xl text-success-600">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Avg Driving Speed</p>
            <p className="text-xl font-bold text-neutral-900 font-mono mt-0.5">{avgSpeed} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
};
