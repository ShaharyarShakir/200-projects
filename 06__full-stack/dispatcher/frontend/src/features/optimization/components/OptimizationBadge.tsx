import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface OptimizationBadgeProps {
  score?: number;
  className?: string;
}

export const OptimizationBadge: React.FC<OptimizationBadgeProps> = ({
  score = 94,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs shadow-sm backdrop-blur-sm ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>Optimized Route</span>
      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
        {score}% Efficiency
      </span>
    </div>
  );
};

