import React from 'react';
import type { ELDSummary } from '../types/eld';
import { Truck, Clock, Moon, Coffee, Fuel, Route, ShieldCheck } from 'lucide-react';

interface LogSummaryProps {
  summary: ELDSummary;
}

export const LogSummary: React.FC<LogSummaryProps> = ({ summary }) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
      <h3 className="text-sm font-bold text-neutral-100 tracking-tight flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-400" /> Daily Duty Hours & Metric Summary
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Driving */}
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-sky-400">
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Driving</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.driving_hours}h</p>
        </div>

        {/* On Duty */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">On Duty</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.duty_hours}h</p>
        </div>

        {/* Sleeper */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-indigo-400">
            <Moon className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Sleeper</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.sleeper_hours}h</p>
        </div>

        {/* Off Duty */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-neutral-400">
            <Coffee className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Off Duty</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.off_duty_hours}h</p>
        </div>

        {/* Miles Driven */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-emerald-400">
            <Route className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Distance</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.total_distance} mi</p>
        </div>

        {/* Fuel Stops */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-orange-400">
            <Fuel className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Fuel Stops</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.fuel_stops}</p>
        </div>

        {/* Rest Stops */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-purple-400">
            <Coffee className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Rest Stops</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.rest_stops}</p>
        </div>

        {/* Cycle Accumulator */}
        <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-3 text-center space-y-1">
          <div className="flex items-center justify-center text-brand-400">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[10px] uppercase font-bold text-brand-300 tracking-wider">Cycle Total</p>
          <p className="text-base font-extrabold text-neutral-100">{summary.cycle_used} / 70h</p>
        </div>
      </div>
    </div>
  );
};
