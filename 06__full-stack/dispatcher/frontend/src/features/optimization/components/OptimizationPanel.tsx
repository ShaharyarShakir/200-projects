import React, { useState } from 'react';
import type { DriverPreferences } from '../types/optimization';
import { Sliders, Play, RotateCcw, Fuel, Clock } from 'lucide-react';

interface OptimizationPanelProps {
  onOptimize: (prefs: DriverPreferences) => void;
  onSimulate?: () => void;
  isLoading?: boolean;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  onOptimize,
  onSimulate,
  isLoading = false,
}) => {
  const [preferredChains, setPreferredChains] = useState<string[]>([
    'Pilot Flying J',
    "Love's Travel Stop",
    'TA Travel Center',
  ]);
  const [fuelThreshold, setFuelThreshold] = useState<number>(15);
  const [maxDriveBlock, setMaxDriveBlock] = useState<number>(8);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [avoidFerries, setAvoidFerries] = useState<boolean>(true);
  const [preferHighways, setPreferHighways] = useState<boolean>(true);

  const toggleChain = (chain: string) => {
    if (preferredChains.includes(chain)) {
      setPreferredChains(preferredChains.filter((c) => c !== chain));
    } else {
      setPreferredChains([...preferredChains, chain]);
    }
  };

  const handleApply = () => {
    onOptimize({
      preferred_chains: preferredChains,
      fuel_threshold_percent: fuelThreshold,
      max_drive_block_hours: maxDriveBlock,
      avoid_tolls: avoidTolls,
      avoid_ferries: avoidFerries,
      prefer_highways: preferHighways,
    });
  };

  const allChains = [
    'Pilot Flying J',
    "Love's Travel Stop",
    'TA Travel Center',
    'Petro Stopping Center',
    'Speedco',
    'Interstate Rest Areas',
  ];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-brand-400" /> Driver Optimization Controls
        </h3>
        <span className="text-[11px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/30">
          Driver Rules
        </span>
      </div>

      {/* Preferred Truck Stop Chains */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-emerald-400" /> Preferred Truck Stop Chains
        </label>
        <div className="flex flex-wrap gap-2">
          {allChains.map((chain) => {
            const isSelected = preferredChains.includes(chain);
            return (
              <button
                key={chain}
                type="button"
                onClick={() => toggleChain(chain)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-600/20 text-brand-300 border-brand-500/50 shadow-sm'
                    : 'bg-neutral-800/60 text-neutral-400 border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                {chain}
              </button>
            );
          })}
        </div>
      </div>

      {/* Threshold Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-emerald-400" /> Fuel Reserve Threshold
            </span>
            <span className="text-emerald-400 font-bold">{fuelThreshold}% Remaining</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={fuelThreshold}
            onChange={(e) => setFuelThreshold(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-300 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Max Drive Block
            </span>
            <span className="text-amber-400 font-bold">{maxDriveBlock} Hours</span>
          </div>
          <input
            type="range"
            min="4"
            max="8"
            step="1"
            value={maxDriveBlock}
            onChange={(e) => setMaxDriveBlock(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-neutral-800/80">
        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={avoidTolls}
            onChange={(e) => setAvoidTolls(e.target.checked)}
            className="rounded border-neutral-700 text-brand-600 focus:ring-0 accent-brand-500"
          />
          <span>Avoid Toll Roads</span>
        </label>

        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={avoidFerries}
            onChange={(e) => setAvoidFerries(e.target.checked)}
            className="rounded border-neutral-700 text-brand-600 focus:ring-0 accent-brand-500"
          />
          <span>Avoid Ferries</span>
        </label>

        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            checked={preferHighways}
            onChange={(e) => setPreferHighways(e.target.checked)}
            className="rounded border-neutral-700 text-brand-600 focus:ring-0 accent-brand-500"
          />
          <span>Prefer Interstate Highways</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Optimizing Route...' : 'Recalculate & Optimize'}
        </button>

        {onSimulate && (
          <button
            type="button"
            onClick={onSimulate}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" /> Route Simulation
          </button>
        )}
      </div>
    </div>
  );
};
