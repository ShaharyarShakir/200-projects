import React from 'react';
import type { RouteComparisonData } from '../types/optimization';
import { TrendingDown, Clock, Fuel, ArrowRight } from 'lucide-react';

interface RouteComparisonProps {
  comparison: RouteComparisonData;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({ comparison }) => {
  const { original, optimized, savings } = comparison;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" /> Route Comparison & Efficiency
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Comparing unoptimized baseline stops vs location-aware dispatch planning
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400">
          Save {savings.time_saved_minutes} mins
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Unoptimized */}
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Original (Naive 1,000m)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">Baseline</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-neutral-400">Distance</div>
              <div className="font-semibold text-neutral-200">{original.distance_miles} mi</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Total Duration</div>
              <div className="font-semibold text-neutral-200">{original.time_hours} hrs</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Fuel Stops</div>
              <div className="font-semibold text-neutral-200">{original.fuel_stops} stops</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Est. Fuel Cost</div>
              <div className="font-semibold text-neutral-200">${original.fuel_cost}</div>
            </div>
          </div>
        </div>

        {/* Optimized */}
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              Optimized Itinerary
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">Location POI</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-neutral-400">Distance</div>
              <div className="font-bold text-emerald-300">{optimized.distance_miles} mi</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Total Duration</div>
              <div className="font-bold text-emerald-300">{optimized.time_hours} hrs</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Fuel Stops</div>
              <div className="font-bold text-emerald-300">{optimized.fuel_stops} stops</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Est. Fuel Cost</div>
              <div className="font-bold text-emerald-300">${optimized.fuel_cost}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Banner */}
      <div className="mt-4 bg-brand-900/20 border border-brand-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-200">
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Saved <strong>{savings.time_saved_minutes} minutes</strong> in driving & dwell delay</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-200">
          <Fuel className="w-4 h-4 text-emerald-400" />
          <span>Saved <strong>${savings.cost_saved_dollars}</strong> in optimized fuel purchasing</span>
        </div>
        <div className="flex items-center gap-1 text-brand-400 font-semibold">
          <span>Active Optimization</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
