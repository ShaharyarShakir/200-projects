import React from 'react';
import type { ELDSummary } from '../types/eld';
import { SteeringWheel, Clock, Moon, Coffee, Fuel, Route, ShieldCheck } from 'lucide-react';

interface LogSummaryProps {
  summary: ELDSummary;
}

export const LogSummary: React.FC<LogSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-lg space-y-4">
      <h3 className="text-sm font-bold text-neutral-800 tracking-tight flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-600" /> Daily Duty Hours & Metric Summary
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Driving */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-blue-600">
            <SteeringWheel className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Driving</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.driving_hours}h</p>
        </div>

        {/* On Duty */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">On Duty</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.duty_hours}h</p>
        </div>

        {/* Sleeper */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-indigo-600">
            <Moon className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Sleeper</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.sleeper_hours}h</p>
        </div>

        {/* Off Duty */}
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-neutral-600">
            <Coffee className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider">Off Duty</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.off_duty_hours}h</p>
        </div>

        {/* Miles Driven */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-emerald-600">
            <Route className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Distance</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.total_distance} mi</p>
        </div>

        {/* Fuel Stops */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-orange-600">
            <Fuel className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-orange-700 tracking-wider">Fuel Stops</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.fuel_stops}</p>
        </div>

        {/* Rest Stops */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-purple-600">
            <Coffee className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Rest Stops</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.rest_stops}</p>
        </div>

        {/* Cycle Accumulator */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-brand-600">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-brand-700 tracking-wider">Cycle Total</p>
          <p className="text-base font-extrabold text-neutral-900">{summary.cycle_used} / 70h</p>
        </div>
      </div>
    </div>
  );
};
