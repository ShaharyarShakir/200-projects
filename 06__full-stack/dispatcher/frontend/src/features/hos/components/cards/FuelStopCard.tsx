import React from 'react';
import { Fuel, MapPin, Clock } from 'lucide-react';
import { HOSEvent } from '../../types/hos';

interface FuelStopCardProps {
  event: HOSEvent;
}

export const FuelStopCard: React.FC<FuelStopCardProps> = ({ event }) => {
  const startTime = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 space-y-2 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-sky-500/20 rounded-xl text-sky-400">
          <Fuel className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-sky-300">Fuel Stop Required</span>
            <span className="text-[11px] font-mono font-semibold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded">
              Every 1,000 Miles Rule
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-400" /> {event.location}
          </p>
        </div>
      </div>

      <div className="text-right font-mono">
        <span className="text-sm font-bold text-sky-300">{startTime} - {endTime}</span>
        <p className="text-xs text-neutral-400 mt-0.5 flex items-center justify-end gap-1">
          <Clock className="w-3 h-3 text-sky-400" /> {event.minutes} min stop
        </p>
      </div>
    </div>
  );
};
