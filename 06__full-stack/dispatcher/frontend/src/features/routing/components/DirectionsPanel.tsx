import React from 'react';
import type { DirectionStep } from '../types/routing';
import { formatDistance } from '../utils/formatters';
import {
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  MapPin,
  CheckCircle2,
  Navigation,
  X,
  Compass
} from 'lucide-react';

interface DirectionsPanelProps {
  steps?: DirectionStep[] | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStepIcon = (type: number, instruction: string) => {
  const lower = instruction.toLowerCase();
  if (lower.includes('left') || type === 0 || type === 1) {
    return <CornerUpLeft className="w-4 h-4 text-blue-400" />;
  }
  if (lower.includes('right') || type === 2 || type === 3) {
    return <CornerUpRight className="w-4 h-4 text-blue-400" />;
  }
  if (lower.includes('arrive') || lower.includes('destination') || type === 10) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  }
  if (lower.includes('depart') || type === 11) {
    return <MapPin className="w-4 h-4 text-amber-400" />;
  }
  return <ArrowUp className="w-4 h-4 text-slate-400" />;
};

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  steps,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-neutral-100 shadow-2xl rounded-r-2xl overflow-hidden min-w-[280px] sm:min-w-[320px] max-w-[360px] animate-in slide-in-from-right-4 duration-300">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/90 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-100">Turn-by-Turn Directions</h3>
            <p className="text-[11px] text-neutral-400">
              {steps && steps.length > 0 ? `${steps.length} Navigation Steps` : 'No route steps'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {!steps || steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-400 space-y-2">
            <Compass className="w-8 h-8 text-neutral-600" />
            <p className="text-xs font-medium">No directions available.</p>
            <p className="text-[11px] text-neutral-500">Calculate a route to view step-by-step driving instructions.</p>
          </div>
        ) : (
          steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-750 hover:border-neutral-700 rounded-xl transition-all group"
            >
              <div className="mt-0.5 p-2 bg-neutral-800 group-hover:bg-brand-500/20 rounded-lg border border-neutral-700/60 shrink-0">
                {getStepIcon(step.type, step.instruction)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-200 leading-tight">
                  {step.instruction}
                </p>
                {step.distance > 0 && (
                  <p className="text-[11px] text-neutral-400 font-mono mt-1">
                    {formatDistance(step.distance)}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded shrink-0 border border-neutral-700">
                #{idx + 1}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
