import React from 'react';
import type { RouteResponse } from '../types/routing';
import { formatDistance, formatDuration, calculateAverageSpeed, calculateETA } from '../utils/formatters';
import { Gauge, Clock, MapPin, Milestone, Calendar, Zap } from 'lucide-react';

interface RouteSummaryProps {
  routeData: RouteResponse | null;
  isLoading: boolean;
}

export const RouteSummary: React.FC<RouteSummaryProps> = ({ routeData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-pulse space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="h-5 bg-slate-800 rounded w-1/3"></div>
          <div className="h-5 bg-slate-800 rounded-full w-24"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-800/80 rounded-xl border border-slate-700/50"></div>
          <div className="h-24 bg-slate-800/80 rounded-xl border border-slate-700/50"></div>
          <div className="h-24 bg-slate-800/80 rounded-xl border border-slate-700/50"></div>
          <div className="h-24 bg-slate-800/80 rounded-xl border border-slate-700/50"></div>
        </div>
      </div>
    );
  }

  if (!routeData) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-2">
        <Milestone className="w-8 h-8 text-blue-400/60 mx-auto" />
        <p className="text-sm font-semibold text-slate-200">No Route Calculated Yet</p>
        <p className="text-xs text-slate-400">Select current location, pickup, and dropoff to compute route distance, travel duration, and estimated arrival time.</p>
      </div>
    );
  }

  const distanceFormatted = formatDistance(routeData.distance);
  const durationFormatted = formatDuration(routeData.duration);
  const avgSpeed = calculateAverageSpeed(routeData.distance, routeData.duration);
  const etaFormatted = calculateETA(routeData.duration);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20">
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Route Summary Metrics
            </h3>
            <p className="text-[11px] text-slate-400">Calculated trip distance and travel duration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Route Active
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Distance Card */}
        <div className="bg-slate-850/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Distance</p>
            <p className="text-lg font-bold text-slate-100 font-mono mt-0.5 truncate">{distanceFormatted}</p>
          </div>
        </div>

        {/* Travel Time Card */}
        <div className="bg-slate-850/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Duration</p>
            <p className="text-lg font-bold text-slate-100 font-mono mt-0.5 truncate">{durationFormatted}</p>
          </div>
        </div>

        {/* Estimated Arrival Card */}
        <div className="bg-slate-850/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Estimated Arrival</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5 truncate">{etaFormatted}</p>
          </div>
        </div>

        {/* Avg Speed & Type Card */}
        <div className="bg-slate-850/80 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 hover:border-slate-700 transition-colors">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Average Speed</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-100 font-mono">{avgSpeed}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-sans flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-400" /> Fastest
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
