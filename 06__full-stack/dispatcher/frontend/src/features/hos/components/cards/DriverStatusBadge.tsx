import React from 'react';
import type { HOSEventType } from '../../types/hos';
import { Coffee, Fuel, BedDouble, PackageCheck, Truck, Clock } from 'lucide-react';

interface DriverStatusBadgeProps {
  type: HOSEventType | string;
  className?: string;
}

export const DriverStatusBadge: React.FC<DriverStatusBadgeProps> = ({ type, className = '' }) => {
  const normalizedType = type.toLowerCase();

  switch (normalizedType) {
    case 'drive':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 ${className}`}>
          <Truck className="w-3.5 h-3.5" /> Driving
        </span>
      );
    case 'break':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 ${className}`}>
          <Coffee className="w-3.5 h-3.5" /> 30m Break
        </span>
      );
    case 'fuel':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400 ${className}`}>
          <Fuel className="w-3.5 h-3.5" /> Fuel Stop
        </span>
      );
    case 'sleep':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 ${className}`}>
          <BedDouble className="w-3.5 h-3.5" /> 10h Sleeper
        </span>
      );
    case 'pickup':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 ${className}`}>
          <PackageCheck className="w-3.5 h-3.5" /> Pickup (On Duty)
        </span>
      );
    case 'dropoff':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 ${className}`}>
          <PackageCheck className="w-3.5 h-3.5" /> Dropoff (On Duty)
        </span>
      );
    case 'off_duty':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400 ${className}`}>
          <Clock className="w-3.5 h-3.5" /> Off Duty / Restart
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400 ${className}`}>
          {type}
        </span>
      );
  }
};
