import React from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

interface TripClockProps {
  startTime?: string;
  endTime?: string;
  totalElapsedHours?: number;
  totalDistance?: number;
}

export const TripClock: React.FC<TripClockProps> = ({
  startTime,
  endTime,
  totalElapsedHours = 0,
  totalDistance = 0,
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-neutral-50/90 border border-neutral-200 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-600" /> Trip Schedule Summary
        </h4>
        {totalDistance > 0 && (
          <span className="text-xs font-mono font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
            {totalDistance} mi
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center bg-neutral-0 border border-neutral-200 rounded-xl p-3.5">
        <div>
          <p className="text-[10px] uppercase text-neutral-400 font-bold">Departure</p>
          <p className="text-lg font-bold text-neutral-900 font-mono mt-0.5">{formatTime(startTime)}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">{formatDate(startTime)}</p>
        </div>

        <div className="flex flex-col items-center justify-center border-x border-neutral-200 px-2">
          <p className="text-[10px] uppercase text-brand-600 font-extrabold">Elapsed</p>
          <p className="text-lg font-bold text-brand-600 font-mono mt-0.5">{totalElapsedHours.toFixed(1)}h</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Total trip time</p>
        </div>

        <div>
          <p className="text-[10px] uppercase text-neutral-400 font-bold">Arrival</p>
          <p className="text-lg font-bold text-neutral-900 font-mono mt-0.5">{formatTime(endTime)}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">{formatDate(endTime)}</p>
        </div>
      </div>
    </div>
  );
};
