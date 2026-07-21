import React from 'react';
import type { AlternativeRoute } from '../types/optimization';
import { Route, Check } from 'lucide-react';

interface AlternativeRoutesProps {
  alternatives: AlternativeRoute[];
  selectedId?: string;
  onSelectRoute?: (routeId: string) => void;
}

export const AlternativeRoutes: React.FC<AlternativeRoutesProps> = ({
  alternatives,
  selectedId = 'fastest',
  onSelectRoute,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Route className="w-5 h-5 text-brand-400" /> Alternative Route Options
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select between fastest transit, fuel savings, or preferred truck stop networks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alternatives.map((route) => {
          const isSelected = route.id === selectedId;
          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute && onSelectRoute(route.id)}
              className={`border rounded-xl p-4 transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-neutral-800 border-brand-500 shadow-lg ring-1 ring-brand-500/50'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-400 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30">
                  {route.tag}
                </span>
                <span className="text-xs font-bold text-emerald-400">{route.score_percent}% Score</span>
              </div>

              <h4 className="text-sm font-bold text-neutral-100 mb-3">{route.name}</h4>

              <div className="space-y-1.5 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Distance:</span>
                  <span className="font-semibold">{route.distance_miles} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Duration:</span>
                  <span className="font-semibold">{route.time_hours} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Fuel Stops:</span>
                  <span className="font-semibold">{route.fuel_stops} stops</span>
                </div>
                <div className="flex justify-between border-t border-neutral-800 pt-1.5">
                  <span className="text-neutral-400">Est. Fuel Cost:</span>
                  <span className="font-bold text-emerald-400">${route.estimated_cost}</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-brand-400 bg-brand-500/10 py-1.5 rounded-lg border border-brand-500/30">
                  <Check className="w-3.5 h-3.5" /> Selected Route
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
